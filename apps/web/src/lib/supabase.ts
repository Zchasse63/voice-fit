/**
 * Supabase Client for VoiceFit Web Dashboard
 * 
 * Provides authenticated access to Supabase database and storage
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }

  return user;
}

/**
 * Get user profile with user_type
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error getting user profile:", error);
    return null;
  }

  return data;
}

/**
 * Check if user is a coach
 */
export async function isCoach(userId: string) {
  const profile = await getUserProfile(userId);
  return profile?.user_type === "coach";
}

/**
 * Check if user is premium
 */
export async function isPremium(userId: string) {
  const profile = await getUserProfile(userId);
  return profile?.user_type === "premium" || profile?.user_type === "coach";
}

/**
 * Get coach's assigned clients
 */
export async function getCoachClients(coachId: string) {
  const { data, error } = await supabase
    .from("client_assignments")
    .select(
      `
      *,
      client:user_profiles!client_id(*)
    `
    )
    .eq("coach_id", coachId)
    .is("revoked_at", null);

  if (error) {
    console.error("Error getting coach clients:", error);
    return [];
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

