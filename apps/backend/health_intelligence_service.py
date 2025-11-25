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

    # ============================================================================
    # Correlation Discovery (Phase 1)
    # ============================================================================

    def discover_correlations(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Discover correlations between nutrition, performance, recovery, and injuries.

        Args:
            user_id: User ID
            days: Number of days to analyze

        Returns:
            Dictionary of discovered correlations
        """
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

            # Fetch all data
            nutrition_data = self._get_nutrition_history(user_id, days=days)
            metrics_data = self._get_metrics_history(user_id, days=days)
            training_data = self._get_training_load_history(user_id, days=days)

            correlations = {
                "nutrition_recovery": self._correlate_nutrition_recovery(nutrition_data, metrics_data),
                "nutrition_performance": self._correlate_nutrition_performance(nutrition_data, training_data),
                "sleep_recovery": self._correlate_sleep_recovery(metrics_data),
                "training_recovery": self._correlate_training_recovery(training_data, metrics_data),
                "protein_recovery": self._correlate_protein_recovery(nutrition_data, metrics_data),
                "carbs_performance": self._correlate_carbs_performance(nutrition_data, training_data),
            }

            return {
                "user_id": user_id,
                "analysis_period_days": days,
                "correlations": correlations,
                "analyzed_at": datetime.now().isoformat(),
            }
        except Exception as e:
            print(f"Error discovering correlations: {e}")
            return {"error": str(e)}

    def _correlate_nutrition_recovery(
        self,
        nutrition_data: List[Dict],
        metrics_data: List[Dict]
    ) -> Dict[str, Any]:
        """Correlate nutrition metrics with recovery scores."""
        try:
            # Extract daily calories and recovery scores
            nutrition_by_date = {n.get("date"): n.get("calories", 0) for n in nutrition_data}
            recovery_by_date = {}

            for metric in metrics_data:
                if metric.get("metric_type") == "recovery_score":
                    date_key = metric.get("date")
                    if date_key not in recovery_by_date:
                        recovery_by_date[date_key] = []
                    recovery_by_date[date_key].append(metric.get("value_numeric", 0))

            # Average recovery scores by date
            recovery_avg = {date: sum(scores) / len(scores) for date, scores in recovery_by_date.items()}

            # Find common dates
            common_dates = set(nutrition_by_date.keys()) & set(recovery_avg.keys())

            if len(common_dates) < 5:
                return {"correlation": 0, "sample_size": len(common_dates), "insight": "Insufficient data"}

            calories = [nutrition_by_date[d] for d in sorted(common_dates)]
            recovery = [recovery_avg[d] for d in sorted(common_dates)]

            correlation = self._calculate_pearson_correlation(calories, recovery)

            return {
                "correlation": round(correlation, 3),
                "sample_size": len(common_dates),
                "insight": self._interpret_correlation(correlation, "calorie intake", "recovery score"),
            }
        except Exception as e:
            print(f"Error correlating nutrition-recovery: {e}")
            return {"error": str(e)}

    def _correlate_nutrition_performance(
        self,
        nutrition_data: List[Dict],
        training_data: List[Dict]
    ) -> Dict[str, Any]:
        """Correlate nutrition with workout performance."""
        try:
            nutrition_by_date = {n.get("date"): n.get("carbs_g", 0) for n in nutrition_data}
            performance_by_date = {}

            for workout in training_data:
                date_key = workout.get("date")
                if date_key not in performance_by_date:
                    performance_by_date[date_key] = []
                # Use duration as proxy for performance
                performance_by_date[date_key].append(workout.get("duration_minutes", 0))

            performance_avg = {date: sum(perf) / len(perf) for date, perf in performance_by_date.items()}

            common_dates = set(nutrition_by_date.keys()) & set(performance_avg.keys())

            if len(common_dates) < 5:
                return {"correlation": 0, "sample_size": len(common_dates), "insight": "Insufficient data"}

            carbs = [nutrition_by_date[d] for d in sorted(common_dates)]
            performance = [performance_avg[d] for d in sorted(common_dates)]

            correlation = self._calculate_pearson_correlation(carbs, performance)

            return {
                "correlation": round(correlation, 3),
                "sample_size": len(common_dates),
                "insight": self._interpret_correlation(correlation, "carb intake", "workout duration"),
            }
        except Exception as e:
            print(f"Error correlating nutrition-performance: {e}")
            return {"error": str(e)}

    def _correlate_sleep_recovery(self, metrics_data: List[Dict]) -> Dict[str, Any]:
        """Correlate sleep duration with recovery scores."""
        try:
            sleep_by_date = {}
            recovery_by_date = {}

            for metric in metrics_data:
                date_key = metric.get("date")
                metric_type = metric.get("metric_type")
                value = metric.get("value_numeric", 0)

                if metric_type == "sleep_duration":
                    if date_key not in sleep_by_date:
                        sleep_by_date[date_key] = []
                    sleep_by_date[date_key].append(value)
                elif metric_type == "recovery_score":
                    if date_key not in recovery_by_date:
                        recovery_by_date[date_key] = []
                    recovery_by_date[date_key].append(value)

            sleep_avg = {date: sum(s) / len(s) for date, s in sleep_by_date.items()}
            recovery_avg = {date: sum(r) / len(r) for date, r in recovery_by_date.items()}

            common_dates = set(sleep_avg.keys()) & set(recovery_avg.keys())

            if len(common_dates) < 5:
                return {"correlation": 0, "sample_size": len(common_dates), "insight": "Insufficient data"}

            sleep = [sleep_avg[d] for d in sorted(common_dates)]
            recovery = [recovery_avg[d] for d in sorted(common_dates)]

            correlation = self._calculate_pearson_correlation(sleep, recovery)

            return {
                "correlation": round(correlation, 3),
                "sample_size": len(common_dates),
                "insight": self._interpret_correlation(correlation, "sleep duration", "recovery score"),
            }
        except Exception as e:
            print(f"Error correlating sleep-recovery: {e}")
            return {"error": str(e)}

    def _correlate_training_recovery(
        self,
        training_data: List[Dict],
        metrics_data: List[Dict]
    ) -> Dict[str, Any]:
        """Correlate training volume with recovery."""
        try:
            volume_by_date = {}
            recovery_by_date = {}

            for workout in training_data:
                date_key = workout.get("date")
                if date_key not in volume_by_date:
                    volume_by_date[date_key] = 0
                volume_by_date[date_key] += workout.get("total_sets", 0)

            for metric in metrics_data:
                if metric.get("metric_type") == "recovery_score":
                    date_key = metric.get("date")
                    if date_key not in recovery_by_date:
                        recovery_by_date[date_key] = []
                    recovery_by_date[date_key].append(metric.get("value_numeric", 0))

            recovery_avg = {date: sum(r) / len(r) for date, r in recovery_by_date.items()}

            common_dates = set(volume_by_date.keys()) & set(recovery_avg.keys())

            if len(common_dates) < 5:
                return {"correlation": 0, "sample_size": len(common_dates), "insight": "Insufficient data"}

            volume = [volume_by_date[d] for d in sorted(common_dates)]
            recovery = [recovery_avg[d] for d in sorted(common_dates)]

            correlation = self._calculate_pearson_correlation(volume, recovery)

            return {
                "correlation": round(correlation, 3),
                "sample_size": len(common_dates),
                "insight": self._interpret_correlation(correlation, "training volume", "recovery score"),
            }
        except Exception as e:
            print(f"Error correlating training-recovery: {e}")
            return {"error": str(e)}

    def _correlate_protein_recovery(
        self,
        nutrition_data: List[Dict],
        metrics_data: List[Dict]
    ) -> Dict[str, Any]:
        """Correlate protein intake with recovery."""
        try:
            protein_by_date = {n.get("date"): n.get("protein_g", 0) for n in nutrition_data}
            recovery_by_date = {}

            for metric in metrics_data:
                if metric.get("metric_type") == "recovery_score":
                    date_key = metric.get("date")
                    if date_key not in recovery_by_date:
                        recovery_by_date[date_key] = []
                    recovery_by_date[date_key].append(metric.get("value_numeric", 0))

            recovery_avg = {date: sum(r) / len(r) for date, r in recovery_by_date.items()}

            common_dates = set(protein_by_date.keys()) & set(recovery_avg.keys())

            if len(common_dates) < 5:
                return {"correlation": 0, "sample_size": len(common_dates), "insight": "Insufficient data"}

            protein = [protein_by_date[d] for d in sorted(common_dates)]
            recovery = [recovery_avg[d] for d in sorted(common_dates)]

            correlation = self._calculate_pearson_correlation(protein, recovery)

            return {
                "correlation": round(correlation, 3),
                "sample_size": len(common_dates),
                "insight": self._interpret_correlation(correlation, "protein intake", "recovery score"),
            }
        except Exception as e:
            print(f"Error correlating protein-recovery: {e}")
            return {"error": str(e)}

    def _correlate_carbs_performance(
        self,
        nutrition_data: List[Dict],
        training_data: List[Dict]
    ) -> Dict[str, Any]:
        """Correlate carb intake with workout performance."""
        try:
            carbs_by_date = {n.get("date"): n.get("carbs_g", 0) for n in nutrition_data}
            performance_by_date = {}

            for workout in training_data:
                date_key = workout.get("date")
                if date_key not in performance_by_date:
                    performance_by_date[date_key] = []
                performance_by_date[date_key].append(workout.get("duration_minutes", 0))

            performance_avg = {date: sum(p) / len(p) for date, p in performance_by_date.items()}

            common_dates = set(carbs_by_date.keys()) & set(performance_avg.keys())

            if len(common_dates) < 5:
                return {"correlation": 0, "sample_size": len(common_dates), "insight": "Insufficient data"}

            carbs = [carbs_by_date[d] for d in sorted(common_dates)]
            performance = [performance_avg[d] for d in sorted(common_dates)]

            correlation = self._calculate_pearson_correlation(carbs, performance)

            return {
                "correlation": round(correlation, 3),
                "sample_size": len(common_dates),
                "insight": self._interpret_correlation(correlation, "carb intake", "workout performance"),
            }
        except Exception as e:
            print(f"Error correlating carbs-performance: {e}")
            return {"error": str(e)}

    def _calculate_pearson_correlation(self, x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient."""
        try:
            if len(x) < 2 or len(y) < 2 or len(x) != len(y):
                return 0.0

            n = len(x)
            mean_x = sum(x) / n
            mean_y = sum(y) / n

            numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
            denominator = (
                (sum((xi - mean_x) ** 2 for xi in x) ** 0.5) *
                (sum((yi - mean_y) ** 2 for yi in y) ** 0.5)
            )

            if denominator == 0:
                return 0.0

            return numerator / denominator
        except Exception as e:
            print(f"Error calculating correlation: {e}")
            return 0.0

    def _interpret_correlation(self, correlation: float, var1: str, var2: str) -> str:
        """Interpret correlation strength."""
        abs_corr = abs(correlation)

        if abs_corr < 0.3:
            strength = "weak"
        elif abs_corr < 0.7:
            strength = "moderate"
        else:
            strength = "strong"

        direction = "positive" if correlation > 0 else "negative"

        return f"{strength.capitalize()} {direction} correlation between {var1} and {var2}"

    # ============================================================================
    # Predictive Models (Phase 2)
    # ============================================================================

    def predict_injury_risk(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Predict injury risk based on training load, recovery, and historical patterns.

        Args:
            user_id: User ID
            days: Number of days to analyze

        Returns:
            Injury risk prediction with factors and recommendations
        """
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

            # Fetch data
            training_data = self._get_training_load_history(user_id, days=days)
            metrics_data = self._get_metrics_history(user_id, days=days)
            nutrition_data = self._get_nutrition_history(user_id, days=days)

            # Calculate risk factors
            risk_score = 0.0
            risk_factors = []

            # Factor 1: Training load spike
            if len(training_data) >= 7:
                recent_volume = sum(w.get("total_sets", 0) for w in training_data[:7])
                previous_volume = sum(w.get("total_sets", 0) for w in training_data[7:14]) if len(training_data) >= 14 else recent_volume

                if previous_volume > 0:
                    volume_increase = (recent_volume - previous_volume) / previous_volume
                    if volume_increase > 0.3:  # 30% increase
                        risk_score += 0.25
                        risk_factors.append({
                            "factor": "Training Load Spike",
                            "severity": "high" if volume_increase > 0.5 else "medium",
                            "description": f"Training volume increased {volume_increase*100:.0f}% in the last week",
                            "recommendation": "Consider a deload week or reduce intensity",
                        })

            # Factor 2: Low recovery
            recovery_scores = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "recovery_score"]
            if recovery_scores:
                avg_recovery = sum(recovery_scores) / len(recovery_scores)
                if avg_recovery < 50:
                    risk_score += 0.25
                    risk_factors.append({
                        "factor": "Low Recovery",
                        "severity": "high" if avg_recovery < 40 else "medium",
                        "description": f"Average recovery score is {avg_recovery:.0f}%",
                        "recommendation": "Prioritize sleep, nutrition, and active recovery",
                    })

            # Factor 3: Poor sleep
            sleep_data = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "sleep_duration"]
            if sleep_data:
                avg_sleep = sum(sleep_data) / len(sleep_data)
                if avg_sleep < 6.5:
                    risk_score += 0.2
                    risk_factors.append({
                        "factor": "Insufficient Sleep",
                        "severity": "high" if avg_sleep < 6 else "medium",
                        "description": f"Average sleep is {avg_sleep:.1f} hours",
                        "recommendation": "Aim for 7-9 hours of sleep per night",
                    })

            # Factor 4: Low protein intake
            if nutrition_data:
                avg_protein = sum(n.get("protein_g", 0) for n in nutrition_data) / len(nutrition_data)
                if avg_protein < 100:
                    risk_score += 0.15
                    risk_factors.append({
                        "factor": "Low Protein Intake",
                        "severity": "medium",
                        "description": f"Average protein intake is {avg_protein:.0f}g",
                        "recommendation": "Increase protein to 0.8-1g per lb of body weight",
                    })

            # Factor 5: High strain without recovery
            strain_scores = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "strain_score"]
            if strain_scores and recovery_scores:
                avg_strain = sum(strain_scores) / len(strain_scores)
                avg_recovery = sum(recovery_scores) / len(recovery_scores)
                if avg_strain > 70 and avg_recovery < 50:
                    risk_score += 0.15
                    risk_factors.append({
                        "factor": "High Strain + Low Recovery",
                        "severity": "critical",
                        "description": f"Strain {avg_strain:.0f}% with recovery {avg_recovery:.0f}%",
                        "recommendation": "Reduce training intensity immediately",
                    })

            # Normalize risk score to 0-100
            risk_percentage = min(100, risk_score * 100)

            return {
                "user_id": user_id,
                "injury_risk_score": round(risk_percentage, 1),
                "risk_level": self._interpret_risk_level(risk_percentage),
                "risk_factors": risk_factors,
                "prediction_date": datetime.now().isoformat(),
            }
        except Exception as e:
            print(f"Error predicting injury risk: {e}")
            return {"error": str(e)}

    def predict_performance(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Predict workout performance based on recovery, nutrition, and sleep.

        Args:
            user_id: User ID
            days: Number of days to analyze

        Returns:
            Performance prediction with readiness score and recommendations
        """
        try:
            # Fetch data
            metrics_data = self._get_metrics_history(user_id, days=days)
            nutrition_data = self._get_nutrition_history(user_id, days=days)
            training_data = self._get_training_load_history(user_id, days=days)

            readiness_score = 50.0  # Start at neutral
            performance_factors = []

            # Factor 1: Recovery score
            recovery_scores = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "recovery_score"]
            if recovery_scores:
                avg_recovery = sum(recovery_scores[-3:]) / min(3, len(recovery_scores))  # Last 3 days
                readiness_score += (avg_recovery - 50) * 0.3
                performance_factors.append({
                    "factor": "Recovery Status",
                    "value": avg_recovery,
                    "impact": "positive" if avg_recovery > 60 else "negative",
                })

            # Factor 2: Sleep quality
            sleep_data = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "sleep_duration"]
            if sleep_data:
                avg_sleep = sum(sleep_data[-3:]) / min(3, len(sleep_data))
                sleep_impact = (avg_sleep - 7) * 5  # 7 hours is optimal
                readiness_score += sleep_impact * 0.2
                performance_factors.append({
                    "factor": "Sleep Quality",
                    "value": avg_sleep,
                    "impact": "positive" if avg_sleep >= 7 else "negative",
                })

            # Factor 3: Nutrition adequacy
            if nutrition_data:
                recent_nutrition = nutrition_data[-3:] if len(nutrition_data) >= 3 else nutrition_data
                avg_calories = sum(n.get("calories", 0) for n in recent_nutrition) / len(recent_nutrition)
                avg_protein = sum(n.get("protein_g", 0) for n in recent_nutrition) / len(recent_nutrition)

                nutrition_score = 0
                if avg_calories > 2000:
                    nutrition_score += 15
                if avg_protein > 100:
                    nutrition_score += 15

                readiness_score += nutrition_score * 0.15
                performance_factors.append({
                    "factor": "Nutrition Status",
                    "value": f"{avg_calories:.0f} kcal, {avg_protein:.0f}g protein",
                    "impact": "positive" if nutrition_score > 20 else "neutral",
                })

            # Factor 4: HRV (Heart Rate Variability)
            hrv_data = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "hrv"]
            if hrv_data:
                avg_hrv = sum(hrv_data[-3:]) / min(3, len(hrv_data))
                hrv_impact = (avg_hrv - 50) * 0.2  # Normalize around 50
                readiness_score += hrv_impact * 0.15
                performance_factors.append({
                    "factor": "HRV Status",
                    "value": avg_hrv,
                    "impact": "positive" if avg_hrv > 50 else "negative",
                })

            # Clamp readiness score to 0-100
            readiness_score = max(0, min(100, readiness_score))

            return {
                "user_id": user_id,
                "readiness_score": round(readiness_score, 1),
                "readiness_level": self._interpret_readiness_level(readiness_score),
                "performance_factors": performance_factors,
                "recommendation": self._get_performance_recommendation(readiness_score),
                "prediction_date": datetime.now().isoformat(),
            }
        except Exception as e:
            print(f"Error predicting performance: {e}")
            return {"error": str(e)}

    def _interpret_risk_level(self, risk_score: float) -> str:
        """Interpret injury risk level."""
        if risk_score < 25:
            return "low"
        elif risk_score < 50:
            return "moderate"
        elif risk_score < 75:
            return "high"
        else:
            return "critical"

    def _interpret_readiness_level(self, readiness_score: float) -> str:
        """Interpret readiness level."""
        if readiness_score < 30:
            return "poor"
        elif readiness_score < 50:
            return "fair"
        elif readiness_score < 70:
            return "good"
        else:
            return "excellent"

    def _get_performance_recommendation(self, readiness_score: float) -> str:
        """Get performance recommendation based on readiness."""
        if readiness_score < 30:
            return "Rest day recommended. Focus on recovery."
        elif readiness_score < 50:
            return "Light activity recommended. Avoid high intensity."
        elif readiness_score < 70:
            return "Moderate intensity workout is appropriate."
        else:
            return "You're ready for a high-intensity workout!"

    # ============================================================================
    # Personalized Insights & Recommendations (Phase 3)
    # ============================================================================

    def generate_personalized_insights(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Generate personalized insights and recommendations based on all health data.

        Args:
            user_id: User ID
            days: Number of days to analyze

        Returns:
            Personalized insights with actionable recommendations
        """
        try:
            # Get all analysis data
            correlations = self.discover_correlations(user_id, days=days)
            injury_risk = self.predict_injury_risk(user_id, days=days)
            performance = self.predict_performance(user_id, days=days)

            # Fetch raw data for additional insights
            nutrition_data = self._get_nutrition_history(user_id, days=days)
            metrics_data = self._get_metrics_history(user_id, days=days)
            training_data = self._get_training_load_history(user_id, days=days)

            insights = []

            # Insight 1: Nutrition-Performance Correlation
            if correlations.get("correlations", {}).get("nutrition_performance", {}).get("correlation", 0) > 0.5:
                insights.append({
                    "type": "nutrition_performance",
                    "title": "Carbs Fuel Your Performance",
                    "description": "Strong correlation detected between carb intake and workout duration. Increasing carbs on training days could improve performance.",
                    "priority": "high",
                    "action": "Aim for 3-5g carbs per lb of body weight on training days",
                })

            # Insight 2: Protein-Recovery Correlation
            if correlations.get("correlations", {}).get("protein_recovery", {}).get("correlation", 0) > 0.5:
                insights.append({
                    "type": "protein_recovery",
                    "title": "Protein Supports Recovery",
                    "description": "Strong correlation between protein intake and recovery scores. Consistent protein intake is key to faster recovery.",
                    "priority": "high",
                    "action": "Maintain 0.8-1g protein per lb of body weight daily",
                })

            # Insight 3: Sleep-Recovery Correlation
            if correlations.get("correlations", {}).get("sleep_recovery", {}).get("correlation", 0) > 0.5:
                insights.append({
                    "type": "sleep_recovery",
                    "title": "Sleep is Your Recovery Tool",
                    "description": "Strong correlation between sleep duration and recovery scores. Prioritizing sleep will significantly improve recovery.",
                    "priority": "high",
                    "action": "Target 7-9 hours of sleep per night",
                })

            # Insight 4: Injury Risk Alert
            if injury_risk.get("risk_level") in ["high", "critical"]:
                insights.append({
                    "type": "injury_risk_alert",
                    "title": f"⚠️ {injury_risk.get('risk_level').upper()} Injury Risk",
                    "description": f"Your injury risk score is {injury_risk.get('injury_risk_score', 0):.0f}%. Review risk factors and adjust training.",
                    "priority": "critical",
                    "action": "Consider a deload week or reduce training intensity",
                    "risk_factors": injury_risk.get("risk_factors", []),
                })

            # Insight 5: Readiness-Based Recommendation
            readiness = performance.get("readiness_score", 50)
            if readiness < 40:
                insights.append({
                    "type": "low_readiness",
                    "title": "Recovery Needed",
                    "description": f"Your readiness score is {readiness:.0f}%. Your body needs more recovery before intense training.",
                    "priority": "high",
                    "action": performance.get("recommendation", "Focus on recovery"),
                })
            elif readiness > 80:
                insights.append({
                    "type": "high_readiness",
                    "title": "Peak Performance Window",
                    "description": f"Your readiness score is {readiness:.0f}%. This is an ideal time for high-intensity training.",
                    "priority": "medium",
                    "action": "Schedule your most important workout today",
                })

            # Insight 6: Training Load Analysis
            if len(training_data) >= 7:
                recent_volume = sum(w.get("total_sets", 0) for w in training_data[:7])
                previous_volume = sum(w.get("total_sets", 0) for w in training_data[7:14]) if len(training_data) >= 14 else recent_volume

                if previous_volume > 0:
                    volume_change = (recent_volume - previous_volume) / previous_volume
                    if volume_change > 0.3:
                        insights.append({
                            "type": "training_load_spike",
                            "title": "Training Load Increased",
                            "description": f"Your training volume increased {volume_change*100:.0f}% this week. Ensure adequate recovery.",
                            "priority": "medium",
                            "action": "Increase sleep, nutrition, and active recovery",
                        })
                    elif volume_change < -0.3:
                        insights.append({
                            "type": "training_load_decrease",
                            "title": "Deload Week Detected",
                            "description": "Your training volume decreased significantly. Good for recovery!",
                            "priority": "low",
                            "action": "Use this time to focus on mobility and technique",
                        })

            # Insight 7: Nutrition Adequacy
            if nutrition_data:
                avg_calories = sum(n.get("calories", 0) for n in nutrition_data) / len(nutrition_data)
                avg_protein = sum(n.get("protein_g", 0) for n in nutrition_data) / len(nutrition_data)

                if avg_calories < 1800:
                    insights.append({
                        "type": "low_calories",
                        "title": "Calorie Intake Low",
                        "description": f"Average daily intake is {avg_calories:.0f} kcal. This may impair recovery and performance.",
                        "priority": "high",
                        "action": "Increase calorie intake by 200-300 kcal per day",
                    })

                if avg_protein < 100:
                    insights.append({
                        "type": "low_protein",
                        "title": "Protein Intake Below Optimal",
                        "description": f"Average protein is {avg_protein:.0f}g. Increase for better recovery.",
                        "priority": "medium",
                        "action": "Add protein-rich foods to each meal",
                    })

            # Sort by priority
            priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
            insights.sort(key=lambda x: priority_order.get(x.get("priority", "low"), 4))

            return {
                "user_id": user_id,
                "insights": insights,
                "total_insights": len(insights),
                "generated_at": datetime.now().isoformat(),
            }
        except Exception as e:
            print(f"Error generating personalized insights: {e}")
            return {"error": str(e)}

    def get_weekly_summary(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Generate a weekly summary of health metrics and recommendations.

        Args:
            user_id: User ID

        Returns:
            Weekly summary with key metrics and trends
        """
        try:
            # Fetch last 7 days of data
            nutrition_data = self._get_nutrition_history(user_id, days=7)
            metrics_data = self._get_metrics_history(user_id, days=7)
            training_data = self._get_training_load_history(user_id, days=7)

            summary = {
                "user_id": user_id,
                "week_ending": datetime.now().isoformat(),
                "metrics": {},
                "trends": {},
                "recommendations": [],
            }

            # Nutrition summary
            if nutrition_data:
                summary["metrics"]["total_calories"] = sum(n.get("calories", 0) for n in nutrition_data)
                summary["metrics"]["avg_daily_calories"] = summary["metrics"]["total_calories"] / len(nutrition_data)
                summary["metrics"]["total_protein"] = sum(n.get("protein_g", 0) for n in nutrition_data)
                summary["metrics"]["avg_daily_protein"] = summary["metrics"]["total_protein"] / len(nutrition_data)

            # Recovery summary
            recovery_scores = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "recovery_score"]
            if recovery_scores:
                summary["metrics"]["avg_recovery"] = sum(recovery_scores) / len(recovery_scores)
                summary["metrics"]["min_recovery"] = min(recovery_scores)
                summary["metrics"]["max_recovery"] = max(recovery_scores)

            # Sleep summary
            sleep_data = [m.get("value_numeric", 0) for m in metrics_data if m.get("metric_type") == "sleep_duration"]
            if sleep_data:
                summary["metrics"]["total_sleep_hours"] = sum(sleep_data)
                summary["metrics"]["avg_sleep_hours"] = summary["metrics"]["total_sleep_hours"] / len(sleep_data)

            # Training summary
            if training_data:
                summary["metrics"]["total_workouts"] = len(training_data)
                summary["metrics"]["total_sets"] = sum(w.get("total_sets", 0) for w in training_data)
                summary["metrics"]["total_duration_minutes"] = sum(w.get("duration_minutes", 0) for w in training_data)

            # Generate recommendations based on summary
            if summary["metrics"].get("avg_daily_calories", 0) < 1800:
                summary["recommendations"].append("Increase calorie intake to support training")

            if summary["metrics"].get("avg_sleep_hours", 0) < 7:
                summary["recommendations"].append("Prioritize sleep - aim for 7-9 hours per night")

            if summary["metrics"].get("avg_recovery", 0) < 50:
                summary["recommendations"].append("Recovery is low - consider a deload week")

            if summary["metrics"].get("total_workouts", 0) > 6:
                summary["recommendations"].append("High training volume - ensure adequate recovery")

            return summary
        except Exception as e:
            print(f"Error generating weekly summary: {e}")
            return {"error": str(e)}

