/**
 * WHOOP OAuth Service
 * 
 * Handles OAuth 2.0 flow for WHOOP integration on mobile
 */

import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../supabase";

interface WHOOPToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  whoop_user_id: string;
}

interface WHOOPConnection {
  provider: string;
  provider_user_id: string;
  is_active: boolean;
  last_sync?: string;
}

export class WHOOPOAuthService {
  private static readonly WHOOP_OAUTH_BASE = "https://api.prod.whoop.com/oauth";
  private static readonly REDIRECT_SCHEME = "voicefit";
  private static readonly REDIRECT_PATH = "whoop-callback";

  /**
   * Get WHOOP authorization URL
   */
  static getAuthorizationUrl(userId: string, state: string): string {
    const redirectUri = `${this.REDIRECT_SCHEME}://${this.REDIRECT_PATH}`;

    const params = new URLSearchParams({
      client_id: process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read:recovery read:sleep read:workout read:cycles offline",
      state: state,
    });

    return `${this.WHOOP_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Start OAuth flow
   */
  static async startOAuthFlow(userId: string): Promise<boolean> {
    try {
      // Generate state token for CSRF protection
      const state = this._generateState();
      await SecureStore.setItemAsync(`whoop_oauth_state_${userId}`, state);

      // Get authorization URL
      const authUrl = this.getAuthorizationUrl(userId, state);

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        `${this.REDIRECT_SCHEME}://${this.REDIRECT_PATH}`
      );

      if (result.type === "success") {
        const url = result.url;
        const code = this._extractCodeFromUrl(url);
        const returnedState = this._extractStateFromUrl(url);

        // Verify state token
        const storedState = await SecureStore.getItemAsync(
          `whoop_oauth_state_${userId}`
        );
        if (returnedState !== storedState) {
          throw new Error("Invalid state token");
        }

        // Exchange code for token
        if (code) {
          await this.exchangeCodeForToken(userId, code);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("WHOOP OAuth error:", error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    userId: string,
    code: string
  ): Promise<WHOOPToken> {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/wearables/whoop/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            code: code,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData: WHOOPToken = await response.json();

      // Store tokens securely
      await SecureStore.setItemAsync(
        `whoop_access_token_${userId}`,
        tokenData.access_token
      );

      if (tokenData.refresh_token) {
        await SecureStore.setItemAsync(
          `whoop_refresh_token_${userId}`,
          tokenData.refresh_token
        );
      }

      // Store expiration time
      const expiresAt = new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString();
      await SecureStore.setItemAsync(
        `whoop_token_expires_${userId}`,
        expiresAt
      );

      return tokenData;
    } catch (error) {
      console.error("Error exchanging WHOOP code:", error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(userId: string): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(
        `whoop_access_token_${userId}`
      );

      if (!token) return null;

      // Check if token is expired
      const expiresAt = await SecureStore.getItemAsync(
        `whoop_token_expires_${userId}`
      );

      if (expiresAt && new Date(expiresAt) < new Date()) {
        // Token expired, try to refresh
        return await this.refreshAccessToken(userId);
      }

      return token;
    } catch (error) {
      console.error("Error getting WHOOP access token:", error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(userId: string): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(
        `whoop_refresh_token_${userId}`
      );

      if (!refreshToken) return null;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/wearables/whoop/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            refresh_token: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const tokenData: WHOOPToken = await response.json();

      // Update stored tokens
      await SecureStore.setItemAsync(
        `whoop_access_token_${userId}`,
        tokenData.access_token
      );

      if (tokenData.refresh_token) {
        await SecureStore.setItemAsync(
          `whoop_refresh_token_${userId}`,
          tokenData.refresh_token
        );
      }

      const expiresAt = new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString();
      await SecureStore.setItemAsync(
        `whoop_token_expires_${userId}`,
        expiresAt
      );

      return tokenData.access_token;
    } catch (error) {
      console.error("Error refreshing WHOOP token:", error);
      return null;
    }
  }

  /**
   * Disconnect WHOOP
   */
  static async disconnect(userId: string): Promise<void> {
    try {
      // Clear stored tokens
      await SecureStore.deleteItemAsync(`whoop_access_token_${userId}`);
      await SecureStore.deleteItemAsync(`whoop_refresh_token_${userId}`);
      await SecureStore.deleteItemAsync(`whoop_token_expires_${userId}`);

      // Notify backend
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/wearables/disconnect/whoop`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        }
      );
    } catch (error) {
      console.error("Error disconnecting WHOOP:", error);
      throw error;
    }
  }

  // Helper methods
  private static _generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private static _extractCodeFromUrl(url: string): string | null {
    const match = url.match(/code=([^&]+)/);
    return match ? match[1] : null;
  }

  private static _extractStateFromUrl(url: string): string | null {
    const match = url.match(/state=([^&]+)/);
    return match ? match[1] : null;
  }
}

