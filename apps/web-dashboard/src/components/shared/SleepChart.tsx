"use client";

/**
 * SleepChart Component
 * 
 * Visualizes sleep sessions with stages breakdown and trends.
 * Shows sleep duration, stages (Deep, REM, Light, Awake), score, and efficiency.
 * 
 * CRITICAL: Matches iOS app design - clean, data-dense visualization
 */

import { useState, useEffect } from "react";
import { Moon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface SleepChartProps {
  userId: string;
  days?: number;
  className?: string;
}

interface SleepSession {
  id: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  deep_sleep_minutes: number;
  rem_sleep_minutes: number;
  light_sleep_minutes: number;
  awake_minutes: number;
  sleep_score: number | null;
  sleep_efficiency: number | null;
  source: string;
}

interface ChartData {
  date: string;
  deep: number;
  rem: number;
  light: number;
  awake: number;
  score: number | null;
  efficiency: number | null;
  total: number;
}

export function SleepChart({ userId, days = 7, className }: SleepChartProps) {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSleepData();
  }, [userId, days]);

  const fetchSleepData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/sleep/${userId}?days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sleep data');
      }

      const data = await response.json();
      const sleepSessions = data.sleep_sessions || [];
      setSessions(sleepSessions);

      // Transform to chart data
      const transformed: ChartData[] = sleepSessions.map((session: SleepSession) => ({
        date: new Date(session.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        deep: Math.round(session.deep_sleep_minutes / 60 * 10) / 10,
        rem: Math.round(session.rem_sleep_minutes / 60 * 10) / 10,
        light: Math.round(session.light_sleep_minutes / 60 * 10) / 10,
        awake: Math.round(session.awake_minutes / 60 * 10) / 10,
        score: session.sleep_score,
        efficiency: session.sleep_efficiency,
        total: Math.round(session.total_duration_minutes / 60 * 10) / 10,
      })).reverse(); // Reverse to show oldest to newest

      setChartData(transformed);
    } catch (error) {
      console.error("Error fetching sleep data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const avgSleep = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length
    : 0;

  const avgScore = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + (d.score || 0), 0) / chartData.length
    : 0;

  if (isLoading) {
    return (
      <div className={cn("card", className)}>
        <div className="flex items-center justify-center h-64">
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary">Loading sleep data...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={cn("card", className)}>
        <div className="flex flex-col items-center justify-center h-64 gap-md">
          <Moon className="w-12 h-12 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
            No sleep data available. Connect a wearable to track your sleep.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card space-y-md", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <Moon className="w-5 h-5 text-accent-light-teal dark:text-accent-dark-teal" />
          <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Sleep Analysis
          </h2>
        </div>
        <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Last {days} days
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-md">
        <div>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Avg Sleep</p>
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {avgSleep.toFixed(1)}h
          </p>
        </div>
        <div>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Avg Score</p>
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {avgScore.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Sleep Stages Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
              formatter={(value: number) => `${value}h`}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar dataKey="deep" stackId="sleep" fill="#3B82F6" name="Deep" />
            <Bar dataKey="rem" stackId="sleep" fill="#8B5CF6" name="REM" />
            <Bar dataKey="light" stackId="sleep" fill="#06B6D4" name="Light" />
            <Bar dataKey="awake" stackId="sleep" fill="#EF4444" name="Awake" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Score (%)"
              yAxisId="right"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep Insights */}
      <div className="pt-md border-t border-border-light dark:border-border-dark">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {avgSleep >= 7 && avgSleep <= 9
            ? "✅ Your sleep duration is in the optimal range (7-9 hours)."
            : avgSleep < 7
            ? "⚠️ You're averaging less than 7 hours of sleep. Consider going to bed earlier."
            : "💤 You're sleeping more than 9 hours on average. This might indicate recovery needs or sleep quality issues."}
        </p>
      </div>
    </div>
  );
}

