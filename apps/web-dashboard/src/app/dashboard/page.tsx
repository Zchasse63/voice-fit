"use client";

/**
 * Premium User Dashboard - Main Page
 * 
 * Shows overview of user's training, health metrics, and recent activity.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HealthInsights } from "@/components/shared/HealthInsights";
import { Analytics } from "@/components/shared/Analytics";
import { Calendar } from "@/components/shared/Calendar";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    } catch (error) {
      console.error("Error getting user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-sm">
          Dashboard
        </h1>
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Welcome back! Here's your training overview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <HealthInsights userId={userId} />
        <Analytics userId={userId} className="lg:col-span-1" />
      </div>

      <Calendar userId={userId} />
    </div>
  );
}

