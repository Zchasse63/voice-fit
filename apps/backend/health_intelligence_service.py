"""
AI Health Intelligence Service

Provides AI-powered health insights based on:
- Wearable data (sleep, HRV, recovery, strain)
- Nutrition data
- Training load and volume
- Injury history
- User-reported readiness

Integrated into main chat, not a separate tab.
Proactive insights triggered by:
- Significant metric changes
- Concerning trends
- Recovery/readiness issues
"""

import os
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class HealthIntelligenceService:
    """AI-powered health insights and recommendations"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def analyze_health_trends(
        self, user_id: str, user_context: str, days: int = 14
    ) -> Dict[str, Any]:
        """
        Analyze health trends and generate insights

        Args:
            user_id: User ID
            user_context: Full user context from UserContextBuilder
            days: Number of days to analyze

        Returns:
            {
                "insights": [{"type": str, "severity": str, "message": str, "recommendation": str}],
                "overall_health_score": float,
                "trends": {"sleep": str, "recovery": str, "strain": str, "nutrition": str}
            }
        """
        try:
            # Get historical metrics
            metrics_data = self._get_metrics_history(user_id, days)
            nutrition_data = self._get_nutrition_history(user_id, days)
            training_load = self._get_training_load_history(user_id, days)

            # Build analysis prompt
            prompt = self._build_health_analysis_prompt(
                user_context, metrics_data, nutrition_data, training_load
            )

            # Call Grok for analysis
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert health and fitness coach analyzing wearable data, nutrition, and training patterns.

Provide actionable insights about:
- Sleep quality and recovery trends
- Training load vs recovery balance
- Nutrition adequacy for training goals
- Injury risk indicators
- Performance optimization opportunities

Format your response as JSON:
{
  "insights": [
    {
      "type": "sleep|recovery|nutrition|training_load|injury_risk",
      "severity": "info|warning|critical",
      "message": "Brief insight description",
      "recommendation": "Specific actionable recommendation"
    }
  ],
  "overall_health_score": 0-100,
  "trends": {
    "sleep": "improving|stable|declining",
    "recovery": "improving|stable|declining",
    "strain": "increasing|stable|decreasing",
    "nutrition": "adequate|insufficient|excessive"
  }
}

Be concise, actionable, and evidence-based. Prioritize critical insights.""",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            # Parse response
            import json

            analysis = json.loads(response.choices[0].message.content)

            # Store insights for future reference
            self._store_health_insights(user_id, analysis)

            return analysis

        except Exception as e:
            print(f"Error analyzing health trends: {e}")
            return {
                "insights": [],
                "overall_health_score": 50,
                "trends": {
                    "sleep": "unknown",
                    "recovery": "unknown",
                    "strain": "unknown",
                    "nutrition": "unknown",
                },
            }

    def check_proactive_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Check for conditions that warrant proactive health alerts

        Returns list of alerts:
        [
            {
                "alert_type": "poor_sleep|low_recovery|high_strain|nutrition_deficit",
                "severity": "info|warning|critical",
                "message": str,
                "trigger_data": dict
            }
        ]
        """
        alerts = []

        try:
            # Get last 3 days of metrics
            recent_metrics = self._get_metrics_history(user_id, days=3)

            # Check sleep quality
            sleep_alerts = self._check_sleep_alerts(recent_metrics)
            alerts.extend(sleep_alerts)

            # Check recovery scores
            recovery_alerts = self._check_recovery_alerts(recent_metrics)
            alerts.extend(recovery_alerts)

            # Check strain vs recovery balance
            balance_alerts = self._check_strain_recovery_balance(recent_metrics)
            alerts.extend(balance_alerts)

            # Check nutrition adequacy
            nutrition_alerts = self._check_nutrition_alerts(user_id)
            alerts.extend(nutrition_alerts)

            return alerts

        except Exception as e:
            print(f"Error checking proactive alerts: {e}")
            return []

    def _get_metrics_history(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Fetch metrics history for analysis"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
            result = (
                self.supabase.table("daily_metrics")
                .select("*")
                .eq("user_id", user_id)
                .gte("date", cutoff_date)
                .order("date", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching metrics history: {e}")
            return []

    def _get_nutrition_history(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Fetch nutrition history for analysis"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
            result = (
                self.supabase.table("daily_nutrition_summary")
                .select("*")
                .eq("user_id", user_id)
                .gte("date", cutoff_date)
                .order("date", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching nutrition history: {e}")
            return []

    def _get_training_load_history(self, user_id: str, days: int) -> List[Dict[str, Any]]:
        """Fetch training load history"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            result = (
                self.supabase.table("workout_logs")
                .select("date, total_sets, avg_rpe, duration_minutes")
                .eq("user_id", user_id)
                .gte("date", cutoff_date)
                .order("date", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching training load: {e}")
            return []

    def _build_health_analysis_prompt(
        self,
        user_context: str,
        metrics_data: List[Dict],
        nutrition_data: List[Dict],
        training_load: List[Dict],
    ) -> str:
        """Build comprehensive health analysis prompt"""
        prompt_parts = [
            "Analyze the following health and training data:\n",
            user_context,
            "\n**Wearable Metrics (Last 14 Days):**",
        ]

        # Group metrics by date
        metrics_by_date = {}
        for metric in metrics_data:
            date_key = metric.get("date", "unknown")
            if date_key not in metrics_by_date:
                metrics_by_date[date_key] = {}
            metric_type = metric.get("metric_type", "unknown")
            value = metric.get("value_numeric", 0)
            metrics_by_date[date_key][metric_type] = value

        for date_key in sorted(metrics_by_date.keys(), reverse=True):
            metrics = metrics_by_date[date_key]
            prompt_parts.append(f"\n{date_key}:")
            for metric_type, value in metrics.items():
                prompt_parts.append(f"  - {metric_type}: {value}")

        # Add nutrition data
        if nutrition_data:
            prompt_parts.append("\n**Nutrition (Last 14 Days):**")
            for entry in nutrition_data:
                date_key = entry.get("date", "unknown")
                calories = entry.get("calories", 0)
                protein = entry.get("protein_g", 0)
                prompt_parts.append(
                    f"\n{date_key}: {calories:.0f} kcal, {protein:.0f}g protein"
                )

        # Add training load
        if training_load:
            prompt_parts.append("\n**Training Load (Last 14 Days):**")
            for workout in training_load:
                date_key = workout.get("date", "unknown")
                sets = workout.get("total_sets", 0)
                rpe = workout.get("avg_rpe", 0)
                prompt_parts.append(f"\n{date_key}: {sets} sets, RPE {rpe}/10")

        return "\n".join(prompt_parts)

    def _check_sleep_alerts(self, metrics: List[Dict]) -> List[Dict[str, Any]]:
        """Check for sleep-related alerts"""
        alerts = []

        # Get sleep duration for last 3 days
        sleep_data = [
            m for m in metrics if m.get("metric_type") == "sleep_duration"
        ]

        if len(sleep_data) >= 3:
            avg_sleep = sum(m.get("value_numeric", 0) for m in sleep_data) / len(sleep_data)

            if avg_sleep < 6.0:
                alerts.append({
                    "alert_type": "poor_sleep",
                    "severity": "critical",
                    "message": f"Your average sleep is {avg_sleep:.1f} hours over the last 3 days. This may impact recovery and performance.",
                    "trigger_data": {"avg_sleep_hours": avg_sleep},
                })
            elif avg_sleep < 7.0:
                alerts.append({
                    "alert_type": "poor_sleep",
                    "severity": "warning",
                    "message": f"Your sleep has been below optimal ({avg_sleep:.1f} hours avg). Consider prioritizing rest.",
                    "trigger_data": {"avg_sleep_hours": avg_sleep},
                })

        return alerts

    def _check_recovery_alerts(self, metrics: List[Dict]) -> List[Dict[str, Any]]:
        """Check for recovery-related alerts"""
        alerts = []

        # Get recovery scores
        recovery_data = [
            m for m in metrics if m.get("metric_type") == "recovery_score"
        ]

        if len(recovery_data) >= 2:
            recent_recovery = recovery_data[0].get("value_numeric", 50)

            if recent_recovery < 33:
                alerts.append({
                    "alert_type": "low_recovery",
                    "severity": "critical",
                    "message": f"Your recovery score is low ({recent_recovery:.0f}%). Consider a rest day or light activity.",
                    "trigger_data": {"recovery_score": recent_recovery},
                })
            elif recent_recovery < 50:
                alerts.append({
                    "alert_type": "low_recovery",
                    "severity": "warning",
                    "message": f"Your recovery is moderate ({recent_recovery:.0f}%). Be mindful of training intensity today.",
                    "trigger_data": {"recovery_score": recent_recovery},
                })

        return alerts

    def _check_strain_recovery_balance(self, metrics: List[Dict]) -> List[Dict[str, Any]]:
        """Check strain vs recovery balance"""
        alerts = []

        # Get strain and recovery
        strain_data = [m for m in metrics if m.get("metric_type") == "strain"]
        recovery_data = [m for m in metrics if m.get("metric_type") == "recovery_score"]

        if strain_data and recovery_data:
            avg_strain = sum(m.get("value_numeric", 0) for m in strain_data) / len(strain_data)
            avg_recovery = sum(m.get("value_numeric", 0) for m in recovery_data) / len(recovery_data)

            # High strain + low recovery = risk
            if avg_strain > 15 and avg_recovery < 50:
                alerts.append({
                    "alert_type": "high_strain",
                    "severity": "warning",
                    "message": f"High strain ({avg_strain:.1f}) with low recovery ({avg_recovery:.0f}%). Consider a deload week.",
                    "trigger_data": {"avg_strain": avg_strain, "avg_recovery": avg_recovery},
                })

        return alerts

    def _check_nutrition_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        """Check nutrition adequacy"""
        alerts = []

        # Get last 3 days of nutrition
        nutrition_data = self._get_nutrition_history(user_id, days=3)

        if len(nutrition_data) >= 2:
            avg_protein = sum(n.get("protein_g", 0) for n in nutrition_data) / len(nutrition_data)

            if avg_protein < 100:
                alerts.append({
                    "alert_type": "nutrition_deficit",
                    "severity": "info",
                    "message": f"Your protein intake is low ({avg_protein:.0f}g avg). Aim for 0.8-1g per lb of body weight.",
                    "trigger_data": {"avg_protein_g": avg_protein},
                })

        return alerts

    def _store_health_insights(self, user_id: str, analysis: Dict[str, Any]):
        """Store health insights for historical tracking"""
        try:
            self.supabase.table("health_insights").insert({
                "user_id": user_id,
                "insights_json": analysis,
                "overall_health_score": analysis.get("overall_health_score", 50),
                "created_at": datetime.now().isoformat(),
            }).execute()
        except Exception as e:
            print(f"Error storing health insights: {e}")

