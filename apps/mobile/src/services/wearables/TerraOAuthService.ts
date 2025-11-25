/**
 * Terra OAuth Service
 * 
 * Handles OAuth 2.0 flow for Terra integration on mobile
 * Terra is an aggregator for 8+ wearable providers:
 * - Garmin
 * - Fitbit
 * - Oura Ring
 * - Apple Health
 * - Google Fit
 * - Withings
 * - Polar
 * - Suunto
 */

import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../supabase";

interface TerraToken {
  access_token: string;
  terra_user_id: string;
  connected_providers: string[];
}

export class TerraOAuthService {
  private static readonly TERRA_OAUTH_BASE = "https://api.tryterra.co/v2/auth";
  private static readonly REDIRECT_SCHEME = "voicefit";
  private static readonly REDIRECT_PATH = "terra-callback";

  /**
   * Get Terra authorization URL
   */
  static getAuthorizationUrl(userId: string): string {
    const redirectUri = `${this.REDIRECT_SCHEME}://${this.REDIRECT_PATH}`;

    const params = new URLSearchParams({
      client_id: process.env.EXPO_PUBLIC_TERRA_DEV_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "activity sleep body daily",
      state: userId,
    });

    return `${this.TERRA_OAUTH_BASE}?${params.toString()}`;
  }

  /**
   * Start OAuth flow
   */
  static async startOAuthFlow(userId: string): Promise<boolean> {
    try {
      // Get authorization URL
      const authUrl = this.getAuthorizationUrl(userId);

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        `${this.REDIRECT_SCHEME}://${this.REDIRECT_PATH}`
      );

      if (result.type === "success") {
        const url = result.url;
        const code = this._extractCodeFromUrl(url);

        // Exchange code for token
        if (code) {
          await this.exchangeCodeForToken(userId, code);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Terra OAuth error:", error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    userId: string,
    code: string
  ): Promise<TerraToken> {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/wearables/terra/callback`,
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

      const tokenData: TerraToken = await response.json();

      // Store token securely
      await SecureStore.setItemAsync(
        `terra_access_token_${userId}`,
        tokenData.access_token
      );

      // Store connected providers
      await SecureStore.setItemAsync(
        `terra_providers_${userId}`,
        JSON.stringify(tokenData.connected_providers)
      );

      return tokenData;
    } catch (error) {
      console.error("Error exchanging Terra code:", error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(userId: string): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(
        `terra_access_token_${userId}`
      );
      return token;
    } catch (error) {
      console.error("Error getting Terra access token:", error);
      return null;
    }
  }

  /**
   * Get connected providers
   */
  static async getConnectedProviders(userId: string): Promise<string[]> {
    try {
      const providersJson = await SecureStore.getItemAsync(
        `terra_providers_${userId}`
      );

      if (!providersJson) return [];

      return JSON.parse(providersJson);
    } catch (error) {
      console.error("Error getting Terra providers:", error);
      return [];
    }
  }

  /**
   * Disconnect Terra
   */
  static async disconnect(userId: string): Promise<void> {
    try {
      // Clear stored tokens
      await SecureStore.deleteItemAsync(`terra_access_token_${userId}`);
      await SecureStore.deleteItemAsync(`terra_providers_${userId}`);

      // Notify backend
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/wearables/disconnect/terra`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        }
      );
    } catch (error) {
      console.error("Error disconnecting Terra:", error);
      throw error;
    }
  }

  // Helper methods
  private static _extractCodeFromUrl(url: string): string | null {
    const match = url.match(/code=([^&]+)/);
    return match ? match[1] : null;
  }
}

