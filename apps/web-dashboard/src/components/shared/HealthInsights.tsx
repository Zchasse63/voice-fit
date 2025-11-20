"use client";

/**
 * HealthInsights Component
 * 
 * Displays health metrics from wearables (WHOOP, Terra, Apple Health).
 * Shows recovery, HRV, sleep, and readiness scores.
 * 
 * CRITICAL: Matches iOS app design - MacroFactor-inspired health snapshot
 */

import { useState, useEffect } from "react";
import { Heart, Activity, Moon, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthInsightsProps {
  userId: string;
  className?: string;
}

interface HealthSnapshot {
  recovery: number | null;
  hrv: number | null;
  restingHR: number | null;
  sleep: number | null;
  spo2: number | null;
  lastUpdated: string | null;
  sources: {
    recovery?: string;
    hrv?: string;
    restingHR?: string;
    sleep?: string;
    spo2?: string;
  };
}

export function HealthInsights({ userId, className }: HealthInsightsProps) {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({
    recovery: null,
    hrv: null,
    restingHR: null,
    sleep: null,
    spo2: null,
    lastUpdated: null,
    sources: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, [userId]);

  const fetchHealthData = async () => {
    try {
      setIsLoading(true);

      // Fetch latest health metrics from new wearable schema
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/metrics/${userId}?days=1`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch health metrics');
      }

      const data = await response.json();
      const metrics = data.metrics || [];

      // Extract latest values for each metric type
      const latestMetrics: HealthSnapshot = {
        recovery: null,
        hrv: null,
        restingHR: null,
        sleep: null,
        spo2: null,
        lastUpdated: null,
        sources: {},
      };

      metrics.forEach((metric: any) => {
        const type = metric.metric_type;
        const value = parseFloat(metric.value_numeric);
        const source = metric.source;

        if (type === 'recovery_score') {
          latestMetrics.recovery = value;
          latestMetrics.sources.recovery = source;
        } else if (type === 'hrv') {
          latestMetrics.hrv = value;
          latestMetrics.sources.hrv = source;
        } else if (type === 'resting_hr') {
          latestMetrics.restingHR = value;
          latestMetrics.sources.restingHR = source;
        } else if (type === 'spo2') {
          latestMetrics.spo2 = value;
          latestMetrics.sources.spo2 = source;
        }

        // Track most recent update
        if (!latestMetrics.lastUpdated || metric.created_at > latestMetrics.lastUpdated) {
          latestMetrics.lastUpdated = metric.created_at;
        }
      });

      // Fetch latest sleep session
      const sleepResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/sleep/${userId}?days=1`,
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
          const latestSleep = sessions[0];
          latestMetrics.sleep = latestSleep.total_duration_minutes / 60; // Convert to hours
          latestMetrics.sources.sleep = latestSleep.source;
        }
      }

      setSnapshot(latestMetrics);
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-text-light-tertiary dark:text-text-dark-tertiary";
    if (score >= 80) return "text-accent-light-green dark:text-accent-dark-green";
    if (score >= 60) return "text-accent-light-orange dark:text-accent-dark-orange";
    return "text-accent-light-red dark:text-accent-dark-red";
  };

  const getScoreIcon = (score: number | null) => {
    if (score === null) return null;
    if (score >= 70) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className={cn("space-y-md", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Health Snapshot
        </h2>
        {snapshot.lastUpdated && (
          <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Updated {new Date(snapshot.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
        {/* Recovery */}
        <div className="card">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <Zap className="w-5 h-5 text-accent-light-blue dark:text-accent-dark-blue" />
              <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                Recovery
              </span>
            </div>
            {snapshot.sources.recovery && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-tertiary dark:text-text-dark-tertiary uppercase">
                {snapshot.sources.recovery}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-xs">
            <p className={cn("text-2xl font-bold", getScoreColor(snapshot.recovery))}>
              {snapshot.recovery !== null ? `${snapshot.recovery}%` : "--"}
            </p>
            {getScoreIcon(snapshot.recovery)}
          </div>
        </div>

        {/* HRV */}
        <div className="card">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <Activity className="w-5 h-5 text-accent-light-purple dark:text-accent-dark-purple" />
              <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                HRV
              </span>
            </div>
            {snapshot.sources.hrv && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-tertiary dark:text-text-dark-tertiary uppercase">
                {snapshot.sources.hrv}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-xs">
            <p className={cn("text-2xl font-bold", getScoreColor(snapshot.hrv))}>
              {snapshot.hrv !== null ? snapshot.hrv : "--"}
            </p>
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              ms
            </span>
          </div>
        </div>

        {/* Resting HR */}
        <div className="card">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <Heart className="w-5 h-5 text-accent-light-coral dark:text-accent-dark-coral" />
              <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                Resting HR
              </span>
            </div>
            {snapshot.sources.restingHR && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-tertiary dark:text-text-dark-tertiary uppercase">
                {snapshot.sources.restingHR}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {snapshot.restingHR !== null ? snapshot.restingHR : "--"}
            </p>
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              bpm
            </span>
          </div>
        </div>

        {/* Sleep */}
        <div className="card">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <Moon className="w-5 h-5 text-accent-light-teal dark:text-accent-dark-teal" />
              <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                Sleep
              </span>
            </div>
            {snapshot.sources.sleep && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-tertiary dark:text-text-dark-tertiary uppercase">
                {snapshot.sources.sleep}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {snapshot.sleep !== null ? `${snapshot.sleep.toFixed(1)}h` : "--"}
            </p>
          </div>
        </div>

        {/* SpO2 */}
        <div className="card col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <Activity className="w-5 h-5 text-accent-light-green dark:text-accent-dark-green" />
              <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                SpO2
              </span>
            </div>
            {snapshot.sources.spo2 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-tertiary dark:text-text-dark-tertiary uppercase">
                {snapshot.sources.spo2}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-xs">
            <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {snapshot.spo2 !== null ? `${snapshot.spo2}%` : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {!isLoading && (
        <div className="card">
          <h3 className="text-md font-semibold text-text-light-primary dark:text-text-dark-primary mb-sm">
            AI Insights
          </h3>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {snapshot.recovery && snapshot.recovery >= 80
              ? "You're well-recovered! Great day for a challenging workout."
              : snapshot.recovery && snapshot.recovery < 60
              ? "Recovery is low. Consider a lighter session or rest day."
              : "Connect your wearable to get personalized insights."}
          </p>
        </div>
      )}
    </div>
  );
}

