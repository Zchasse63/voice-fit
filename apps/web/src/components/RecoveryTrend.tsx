"use client";

/**
 * RecoveryTrend Component
 * 
 * Visualizes recovery score, HRV, and resting HR trends over time.
 * Color-coded zones (red/yellow/green) for quick assessment.
 * 
 * CRITICAL: Matches iOS app design - clean trend visualization
 */

import { useState, useEffect } from "react";
import { Activity, Heart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RecoveryTrendProps {
  userId: string;
  days?: number;
  className?: string;
}

interface HealthMetric {
  id: string;
  date: string;
  metric_type: string;
  value_numeric: number;
  source: string;
}

interface ChartData {
  date: string;
  recovery: number | null;
  hrv: number | null;
  restingHR: number | null;
}

export function RecoveryTrend({ userId, days = 14, className }: RecoveryTrendProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecoveryData();
  }, [userId, days]);

  const fetchRecoveryData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/metrics/${userId}?days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recovery data');
      }

      const data = await response.json();
      const healthMetrics = data.metrics || [];
      setMetrics(healthMetrics);

      // Group by date and metric type
      const byDate: Record<string, ChartData> = {};

      healthMetrics.forEach((metric: HealthMetric) => {
        const date = metric.date;
        if (!byDate[date]) {
          byDate[date] = { date, recovery: null, hrv: null, restingHR: null };
        }

        if (metric.metric_type === 'recovery_score') {
          byDate[date].recovery = metric.value_numeric;
        } else if (metric.metric_type === 'hrv') {
          byDate[date].hrv = metric.value_numeric;
        } else if (metric.metric_type === 'resting_hr') {
          byDate[date].restingHR = metric.value_numeric;
        }
      });

      // Convert to array and sort by date
      const transformed = Object.values(byDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

      setChartData(transformed);
    } catch (error) {
      console.error("Error fetching recovery data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const avgRecovery = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + (d.recovery || 0), 0) / chartData.filter(d => d.recovery).length
    : 0;

  const avgHRV = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + (d.hrv || 0), 0) / chartData.filter(d => d.hrv).length
    : 0;

  const avgRestingHR = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + (d.restingHR || 0), 0) / chartData.filter(d => d.restingHR).length
    : 0;

  if (isLoading) {
    return (
      <div className={cn("card", className)}>
        <div className="flex items-center justify-center h-64">
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary">Loading recovery data...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={cn("card", className)}>
        <div className="flex flex-col items-center justify-center h-64 gap-md">
          <Zap className="w-12 h-12 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
            No recovery data available. Connect a wearable to track your recovery.
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
          <Zap className="w-5 h-5 text-accent-light-blue dark:text-accent-dark-blue" />
          <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Recovery Trends
          </h2>
        </div>
        <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Last {days} days
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-md">
        <div>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Avg Recovery</p>
          <p className={cn("text-2xl font-bold", avgRecovery >= 70 ? "text-accent-light-green dark:text-accent-dark-green" : avgRecovery >= 50 ? "text-accent-light-yellow dark:text-accent-dark-yellow" : "text-accent-light-coral dark:text-accent-dark-coral")}>
            {avgRecovery.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Avg HRV</p>
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {avgHRV.toFixed(0)} ms
          </p>
        </div>
        <div>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Avg RHR</p>
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {avgRestingHR.toFixed(0)} bpm
          </p>
        </div>
      </div>

      {/* Recovery Score Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {/* Recovery zones */}
            <ReferenceLine y={70} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Good', position: 'right', fill: '#10B981' }} />
            <ReferenceLine y={50} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Fair', position: 'right', fill: '#F59E0B' }} />
            <Line
              type="monotone"
              dataKey="recovery"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 5 }}
              name="Recovery Score"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* HRV & Resting HR Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              label={{ value: 'RHR (bpm)', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="hrv"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="HRV (ms)"
              connectNulls
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="restingHR"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Resting HR (bpm)"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recovery Insights */}
      <div className="pt-md border-t border-border-light dark:border-border-dark">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {avgRecovery >= 70
            ? "🟢 Your recovery is consistently good. You're ready for challenging workouts."
            : avgRecovery >= 50
            ? "🟡 Your recovery is moderate. Balance hard training with adequate rest."
            : "🔴 Your recovery is low. Prioritize sleep, nutrition, and lighter training loads."}
        </p>
      </div>
    </div>
  );
}

