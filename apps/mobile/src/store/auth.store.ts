import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "../services/database/supabase.client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { AnalyticsService } from "../services/analytics/AnalyticsService";
import { AnalyticsEvents } from "../services/analytics/events";

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  email: string;
  name?: string;
  tier?: "free" | "premium" | "admin";
  authProvider?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const mapSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;

  const userMetadata: any = supabaseUser.user_metadata || {};
  const appMetadata: any = (supabaseUser as any).app_metadata || {};

  const rawTier =
    userMetadata.tier ??
    userMetadata.subscription_tier ??
    appMetadata.tier ??
    appMetadata.subscription_tier ??
    "free";

  let tier: "free" | "premium" | "admin" = "free";
  if (typeof rawTier === "string") {
    const normalized = rawTier.toLowerCase();
    if (normalized === "premium" || normalized === "admin") {
      tier = normalized;
    }
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name: userMetadata.name || supabaseUser.user_metadata?.name,
    tier,
    authProvider: appMetadata.provider || (supabaseUser.identities?.[0]?.provider),
  };
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        error: null,

        signIn: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) throw error;

            const user = mapSupabaseUser(data.user);
            set({ user, isLoading: false });

            if (user) {
              AnalyticsService.logEvent(AnalyticsEvents.USER_LOGGED_IN, {
                auth_method: "password",
                platform: Platform.OS,
              });
            }
          } catch (error) {
            const message =
              error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "Sign in failed";
            set({ error: message, isLoading: false });
            throw new Error(message);
          }
        },

        signUp: async (email, password, name) => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: name || "",
                },
              },
            });
            if (error) throw error;

            const user = mapSupabaseUser(data.user);
            set({ user, isLoading: false });

            if (user) {
              AnalyticsService.logEvent(AnalyticsEvents.USER_SIGNED_UP, {
                auth_method: "password",
                platform: Platform.OS,
              });
            }
          } catch (error) {
            const message =
              error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "Sign up failed";
            set({ error: message, isLoading: false });
            throw new Error(message);
          }
        },

        signInWithApple: async () => {
          set({ isLoading: true, error: null });
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });

            if (credential.identityToken) {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: "apple",
                token: credential.identityToken,
              });

              if (error) throw error;
              const user = mapSupabaseUser(data.user);
              set({ user, isLoading: false });

              if (user) {
                AnalyticsService.logEvent(AnalyticsEvents.USER_LOGGED_IN, {
                  auth_method: "apple",
                  platform: Platform.OS,
                });
              }
            } else {
              throw new Error("No identity token returned from Apple");
            }
          } catch (error) {
            const message =
              error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "Apple sign in failed";
            set({ error: message, isLoading: false });
            throw new Error(message);
          }
        },

        signInWithGoogle: async () => {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: "voicefit://auth/callback",
              },
            });

            if (error) throw error;
            // OAuth flow will redirect back to the app
            // Session will be picked up by checkSession
            set({ isLoading: false });
          } catch (error) {
            const message =
              error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "Google sign in failed";
            set({ error: message, isLoading: false });
            throw new Error(message);
          }
        },

        signOut: async () => {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            set({ user: null, isLoading: false });
          } catch (error) {
            const message =
              error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "Sign out failed";
            set({ error: message, isLoading: false });
            throw new Error(message);
          }
        },

        checkSession: async () => {
          set({ isLoading: true });
          try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            set({
              user: mapSupabaseUser(data.session?.user ?? null),
              isLoading: false,
            });
          } catch (error) {
            const message =
              error && typeof error === "object" && "message" in error
                ? (error as any).message
                : "Session check failed";
            set({ error: message, isLoading: false, user: null });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => localStorage),
      },
    ),
    { name: "AuthStore" },
  ),
);
