"use client";

/**
 * Analytics Component
 * 
 * Displays workout analytics, progress charts, and health metrics.
 * Shared between Premium and Coach dashboards.
 * 
 * CRITICAL: Matches iOS app design - MacroFactor-inspired data visualization
 */

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Zap, Heart, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SleepChart } from "./SleepChart";
import { RecoveryTrend } from "./RecoveryTrend";

interface AnalyticsProps {
  userId: string;
  className?: string;
}

interface Stats {
  totalWorkouts: number;
  completedWorkouts: number;
  currentStreak: number;
  weeklyProgress: number;
  avgRecovery: number | null;
  avgSleep: number | null;
}

export function Analytics({ userId, className }: AnalyticsProps) {
  const [stats, setStats] = useState<Stats>({
    totalWorkouts: 0,
    completedWorkouts: 0,
    currentStreak: 0,
    weeklyProgress: 0,
    avgRecovery: null,
    avgSleep: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      // Fetch workout stats
      // TODO: Implement actual workout stats endpoint
      const workoutStats = {
        totalWorkouts: 0,
        completedWorkouts: 0,
        currentStreak: 0,
        weeklyProgress: 0,
      };

      // Fetch wearable stats
      const metricsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/metrics/${userId}?days=7`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      let avgRecovery = null;
      let avgSleep = null;

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        const metrics = metricsData.metrics || [];

        // Calculate average recovery
        const recoveryMetrics = metrics.filter((m: any) => m.metric_type === 'recovery_score');
        if (recoveryMetrics.length > 0) {
          avgRecovery = recoveryMetrics.reduce((sum: number, m: any) => sum + parseFloat(m.value_numeric), 0) / recoveryMetrics.length;
        }
      }

      // Fetch sleep stats
      const sleepResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/sleep/${userId}?days=7`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (sleepResponse.ok) {
        const sleepData = await sleepResponse.json();
        const sessions = sleepData.sleep_sessions || [];

        if (sessions.length > 0) {
          avgSleep = sessions.reduce((sum: number, s: any) => sum + s.total_duration_minutes, 0) / sessions.length / 60;
        }
      }

      setStats({
        ...workoutStats,
        avgRecovery,
        avgSleep,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate = stats.totalWorkouts > 0
    ? Math.round((stats.completedWorkouts / stats.totalWorkouts) * 100)
    : 0;

  return (
    <div className={cn("space-y-lg", className)}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
        {/* Total Workouts */}
        <div className="card">
          <div className="flex items-center gap-sm mb-sm">
            <Activity className="w-5 h-5 text-accent-light-blue dark:text-accent-dark-blue" />
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Total Workouts
            </span>
          </div>
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {stats.totalWorkouts}
          </p>
        </div>

        {/* Completion Rate */}
        <div className="card">
          <div className="flex items-center gap-sm mb-sm">
            <Zap className="w-5 h-5 text-accent-light-green dark:text-accent-dark-green" />
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Completion
            </span>
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {completionRate}%
            </p>
            {completionRate >= 80 && (
              <TrendingUp className="w-4 h-4 text-accent-light-green dark:text-accent-dark-green" />
            )}
            {completionRate < 80 && (
              <TrendingDown className="w-4 h-4 text-accent-light-orange dark:text-accent-dark-orange" />
            )}
          </div>
        </div>

        {/* Current Streak */}
        <div className="card">
          <div className="flex items-center gap-sm mb-sm">
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Current Streak
            </span>
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.currentStreak}
            </p>
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              days
            </span>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="card">
          <div className="flex items-center gap-sm mb-sm">
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              This Week
            </span>
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.weeklyProgress}
            </p>
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              / 7
            </span>
          </div>
        </div>

        {/* Avg Recovery */}
        <div className="card">
          <div className="flex items-center gap-sm mb-sm">
            <Zap className="w-5 h-5 text-accent-light-blue dark:text-accent-dark-blue" />
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Avg Recovery
            </span>
          </div>
          <div className="flex items-baseline gap-xs">
            <p className={cn(
              "text-2xl font-bold",
              stats.avgRecovery && stats.avgRecovery >= 70
                ? "text-accent-light-green dark:text-accent-dark-green"
                : stats.avgRecovery && stats.avgRecovery >= 50
                ? "text-accent-light-yellow dark:text-accent-dark-yellow"
                : "text-accent-light-coral dark:text-accent-dark-coral"
            )}>
              {stats.avgRecovery !== null ? `${stats.avgRecovery.toFixed(0)}%` : "--"}
            </p>
          </div>
        </div>

        {/* Avg Sleep */}
        <div className="card">
          <div className="flex items-center gap-sm mb-sm">
            <Moon className="w-5 h-5 text-accent-light-teal dark:text-accent-dark-teal" />
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Avg Sleep
            </span>
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {stats.avgSleep !== null ? `${stats.avgSleep.toFixed(1)}h` : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Recovery Trends */}
      <RecoveryTrend userId={userId} days={14} />

      {/* Sleep Analysis */}
      <SleepChart userId={userId} days={7} />

      {/* Training vs Recovery Correlation */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-md">
          Training & Recovery Balance
        </h3>

        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
              Loading correlation data...
            </p>
          </div>
        ) : (
          <div className="space-y-md">
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {stats.avgRecovery && stats.avgRecovery >= 70
                ? "✅ Your recovery is keeping pace with your training load. Great balance!"
                : stats.avgRecovery && stats.avgRecovery >= 50
                ? "⚠️ Your recovery is moderate. Consider balancing hard training with adequate rest."
                : stats.avgRecovery
                ? "🔴 Your recovery is low relative to training. Prioritize sleep and lighter loads."
                : "Connect a wearable to see how your training affects your recovery."}
            </p>

            {stats.avgSleep && stats.avgSleep < 7 && (
              <div className="p-md rounded-lg bg-accent-light-yellow/10 dark:bg-accent-dark-yellow/10 border border-accent-light-yellow dark:border-accent-dark-yellow">
                <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  💤 <strong>Sleep Alert:</strong> You're averaging {stats.avgSleep.toFixed(1)} hours of sleep.
                  Aim for 7-9 hours to optimize recovery and performance.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

