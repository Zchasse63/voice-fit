"""
Health Snapshot Service

Generates daily AI-powered health snapshots combining:
- Wearable data (sleep, HRV, recovery)
- Training data (volume, intensity, adherence)
- Nutrition data (calories, macros, hydration)
- Subjective metrics (readiness, soreness, mood)
"""

import os
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
from supabase import Client
from decimal import Decimal
import json


class HealthSnapshotService:
    """Service for generating and managing health snapshots"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.ai_model = os.getenv("AI_MODEL", "grok-4-fast-reasoning")
        self.ai_api_key = os.getenv("XAI_API_KEY")

        # Injury risk thresholds
        self.INJURY_RISK_THRESHOLDS = {
            'volume_spike': 1.3,  # 30% increase week-over-week
            'low_recovery': 60,   # Recovery score below 60%
            'high_soreness': 7,   # Soreness level above 7/10
            'consecutive_high_intensity': 3,  # 3+ high-intensity days in a row
        }

    async def generate_snapshot(
        self, user_id: str, snapshot_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a health snapshot for a specific date

        Args:
            user_id: User ID
            snapshot_date: Date in YYYY-MM-DD format (defaults to today)

        Returns:
            Generated health snapshot
        """
        if not snapshot_date:
            snapshot_date = str(date.today())

        # 1. Fetch all data sources
        sleep_data = await self._fetch_sleep_data(user_id, snapshot_date)
        metrics_data = await self._fetch_health_metrics(user_id, snapshot_date)
        training_data = await self._fetch_training_data(user_id, snapshot_date)
        nutrition_data = await self._fetch_nutrition_data(user_id, snapshot_date)
        subjective_data = await self._fetch_subjective_data(user_id, snapshot_date)

        # 2. Calculate data completeness
        completeness = self._calculate_completeness(
            sleep_data, metrics_data, training_data, nutrition_data, subjective_data
        )

        # 3. Generate AI insights
        ai_insights = await self._generate_ai_insights(
            user_id,
            snapshot_date,
            sleep_data,
            metrics_data,
            training_data,
            nutrition_data,
            subjective_data,
        )

        # 4. Build snapshot object
        snapshot = {
            "user_id": user_id,
            "date": snapshot_date,
            # Sleep & Recovery
            "sleep_duration_hours": sleep_data.get("duration_hours"),
            "sleep_quality_score": sleep_data.get("quality_score"),
            "hrv_score": metrics_data.get("hrv"),
            "resting_heart_rate": metrics_data.get("resting_hr"),
            "recovery_score": metrics_data.get("recovery_score"),
            # Training
            "training_volume_minutes": training_data.get("volume_minutes"),
            "training_intensity_score": training_data.get("intensity_score"),
            "adherence_percentage": training_data.get("adherence_percentage"),
            "workouts_completed": training_data.get("workouts_completed"),
            "workouts_scheduled": training_data.get("workouts_scheduled"),
            # Nutrition
            "calories_consumed": nutrition_data.get("calories"),
            "protein_grams": nutrition_data.get("protein"),
            "carbs_grams": nutrition_data.get("carbs"),
            "fats_grams": nutrition_data.get("fats"),
            "hydration_liters": nutrition_data.get("hydration"),
            # Subjective
            "readiness_score": subjective_data.get("readiness"),
            "soreness_level": subjective_data.get("soreness"),
            "mood_score": subjective_data.get("mood"),
            # AI Insights
            "ai_summary": ai_insights.get("summary"),
            "ai_recommendations": ai_insights.get("recommendations", []),
            "risk_flags": ai_insights.get("risk_flags", []),
            # Metadata
            "data_completeness_score": completeness,
            "generated_at": datetime.now().isoformat(),
        }

        # 5. Upsert to database
        result = self.supabase.table("health_snapshots").upsert(snapshot).execute()

        return result.data[0] if result.data else snapshot

    async def _fetch_sleep_data(
        self, user_id: str, snapshot_date: str
    ) -> Dict[str, Any]:
        """Fetch sleep data for the date"""
        try:
            result = (
                self.supabase.table("sleep_sessions")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time", f"{snapshot_date}T00:00:00")
                .lte("start_time", f"{snapshot_date}T23:59:59")
                .order("start_time", desc=True)
                .limit(1)
                .execute()
            )

            if result.data:
                session = result.data[0]
                return {
                    "duration_hours": float(session.get("duration_minutes", 0) / 60),
                    "quality_score": session.get("quality_score"),
                }
            return {}
        except Exception as e:
            print(f"Error fetching sleep data: {e}")
            return {}

    async def _fetch_health_metrics(
        self, user_id: str, snapshot_date: str
    ) -> Dict[str, Any]:
        """Fetch health metrics for the date"""
        try:
            result = (
                self.supabase.table("health_metrics")
                .select("*")
                .eq("user_id", user_id)
                .eq("date", snapshot_date)
                .execute()
            )

            metrics = {}
            for metric in result.data:
                metric_type = metric.get("metric_type")
                value = metric.get("value_numeric")

                if metric_type == "hrv":
                    metrics["hrv"] = int(value) if value else None
                elif metric_type == "resting_heart_rate":
                    metrics["resting_hr"] = int(value) if value else None
                elif metric_type == "recovery_score":
                    metrics["recovery_score"] = int(value) if value else None

            return metrics
        except Exception as e:
            print(f"Error fetching health metrics: {e}")
            return {}

    async def _fetch_training_data(
        self, user_id: str, snapshot_date: str
    ) -> Dict[str, Any]:
        """Fetch training data for the date"""
        try:
            # Get scheduled workouts
            scheduled_result = (
                self.supabase.table("scheduled_workouts")
                .select("*")
                .eq("user_id", user_id)
                .eq("scheduled_date", snapshot_date)
                .execute()
            )

            # Get completed workouts
            completed_result = (
                self.supabase.table("workout_logs")
                .select("*")
                .eq("user_id", user_id)
                .gte("created_at", f"{snapshot_date}T00:00:00")
                .lte("created_at", f"{snapshot_date}T23:59:59")
                .execute()
            )

            scheduled_count = len(scheduled_result.data) if scheduled_result.data else 0
            completed_count = len(completed_result.data) if completed_result.data else 0

            # Calculate total volume and intensity
            total_volume = 0
            total_intensity = 0

            for workout in completed_result.data or []:
                # Estimate volume from sets
                sets_count = len(workout.get("sets", []))
                total_volume += sets_count * 3  # Rough estimate: 3 minutes per set

                # Estimate intensity from RPE or weight
                # This is a simplified calculation
                total_intensity += 70  # Default moderate intensity

            avg_intensity = (
                int(total_intensity / completed_count) if completed_count > 0 else 0
            )
            adherence = (
                float(completed_count / scheduled_count * 100)
                if scheduled_count > 0
                else 0
            )

            return {
                "volume_minutes": total_volume,
                "intensity_score": avg_intensity,
                "adherence_percentage": adherence,
                "workouts_completed": completed_count,
                "workouts_scheduled": scheduled_count,
            }
        except Exception as e:
            print(f"Error fetching training data: {e}")
            return {}

    async def _fetch_nutrition_data(
        self, user_id: str, snapshot_date: str
    ) -> Dict[str, Any]:
        """Fetch nutrition data for the date"""
        try:
            result = (
                self.supabase.table("daily_summaries")
                .select("*")
                .eq("user_id", user_id)
                .eq("date", snapshot_date)
                .execute()
            )

            if result.data:
                summary = result.data[0]
                return {
                    "calories": summary.get("calories_consumed"),
                    "protein": float(summary.get("protein_grams", 0)),
                    "carbs": float(summary.get("carbs_grams", 0)),
                    "fats": float(summary.get("fats_grams", 0)),
                    "hydration": float(summary.get("hydration_liters", 0)),
                }
            return {}
        except Exception as e:
            print(f"Error fetching nutrition data: {e}")
            return {}

    async def _fetch_subjective_data(
        self, user_id: str, snapshot_date: str
    ) -> Dict[str, Any]:
        """Fetch subjective metrics for the date"""
        try:
            result = (
                self.supabase.table("readiness_scores")
                .select("*")
                .eq("user_id", user_id)
                .eq("date", snapshot_date)
                .execute()
            )

            if result.data:
                score = result.data[0]
                return {
                    "readiness": score.get("score"),
                    "soreness": score.get("soreness_level"),
                    "mood": score.get("mood_score"),
                }
            return {}
        except Exception as e:
            print(f"Error fetching subjective data: {e}")
            return {}

    def _calculate_completeness(self, *data_sources) -> int:
        """Calculate data completeness score (0-100)"""
        total_fields = 0
        filled_fields = 0

        for source in data_sources:
            if isinstance(source, dict):
                total_fields += len(source.keys()) if source else 5
                filled_fields += sum(1 for v in source.values() if v is not None)

        return int((filled_fields / total_fields * 100)) if total_fields > 0 else 0

    async def _generate_ai_insights(
        self,
        user_id: str,
        snapshot_date: str,
        sleep_data: Dict,
        metrics_data: Dict,
        training_data: Dict,
        nutrition_data: Dict,
        subjective_data: Dict,
    ) -> Dict[str, Any]:
        """Generate AI insights using xAI Grok"""
        try:
            # Build prompt
            prompt = f"""You are a health and fitness AI analyzing a user's daily health data.

**Today's Data ({snapshot_date}):**

**Sleep & Recovery:**
- Sleep Duration: {sleep_data.get('duration_hours', 'N/A')} hours
- Sleep Quality: {sleep_data.get('quality_score', 'N/A')}/100
- HRV: {metrics_data.get('hrv', 'N/A')} ms
- Resting HR: {metrics_data.get('resting_hr', 'N/A')} bpm
- Recovery Score: {metrics_data.get('recovery_score', 'N/A')}/100

**Training:**
- Volume: {training_data.get('volume_minutes', 'N/A')} minutes
- Intensity: {training_data.get('intensity_score', 'N/A')}/100
- Adherence: {training_data.get('adherence_percentage', 'N/A')}%
- Workouts: {training_data.get('workouts_completed', 0)}/{training_data.get('workouts_scheduled', 0)}

**Nutrition:**
- Calories: {nutrition_data.get('calories', 'N/A')} kcal
- Protein: {nutrition_data.get('protein', 'N/A')}g | Carbs: {nutrition_data.get('carbs', 'N/A')}g | Fats: {nutrition_data.get('fats', 'N/A')}g
- Hydration: {nutrition_data.get('hydration', 'N/A')}L

**Subjective:**
- Readiness: {subjective_data.get('readiness', 'N/A')}/5
- Soreness: {subjective_data.get('soreness', 'N/A')}/5
- Mood: {subjective_data.get('mood', 'N/A')}/5

**Instructions:**
1. Generate a concise 2-3 sentence summary of the user's health status
2. Identify 2-3 specific, actionable recommendations
3. Flag any risks (overtraining, poor recovery, nutrition deficits)
4. Use a supportive, coaching tone

**Output Format (JSON):**
{{
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "risk_flags": ["..."]
}}"""

            # Call xAI Grok API
            import httpx

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.ai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.ai_model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a health and fitness AI assistant. Always respond with valid JSON.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.7,
                    },
                    timeout=30.0,
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]

                    # Parse JSON response
                    try:
                        insights = json.loads(content)
                        return insights
                    except json.JSONDecodeError:
                        # Fallback if AI doesn't return valid JSON
                        return {
                            "summary": content[:200],
                            "recommendations": [],
                            "risk_flags": [],
                        }
                else:
                    print(f"AI API error: {response.status_code} - {response.text}")
                    return self._generate_fallback_insights(
                        sleep_data,
                        metrics_data,
                        training_data,
                        nutrition_data,
                        subjective_data,
                    )

        except Exception as e:
            print(f"Error generating AI insights: {e}")
            return self._generate_fallback_insights(
                sleep_data, metrics_data, training_data, nutrition_data, subjective_data
            )

    def _generate_fallback_insights(
        self,
        sleep_data: Dict,
        metrics_data: Dict,
        training_data: Dict,
        nutrition_data: Dict,
        subjective_data: Dict,
    ) -> Dict[str, Any]:
        """Generate basic insights without AI"""
        summary_parts = []
        recommendations = []
        risk_flags = []

        # Sleep analysis
        sleep_hours = sleep_data.get("duration_hours", 0)
        if sleep_hours and sleep_hours < 7:
            summary_parts.append(f"Sleep duration ({sleep_hours}h) is below optimal")
            recommendations.append("Aim for 7-9 hours of sleep tonight")
            risk_flags.append("Insufficient sleep")

        # Recovery analysis
        recovery = metrics_data.get("recovery_score", 0)
        if recovery and recovery < 50:
            summary_parts.append("Recovery score is low")
            recommendations.append("Consider a lighter training day or rest")
            risk_flags.append("Low recovery")

        # Training adherence
        adherence = training_data.get("adherence_percentage", 0)
        if adherence and adherence < 70:
            summary_parts.append(f"Training adherence ({adherence:.0f}%) needs improvement")
            recommendations.append("Try to complete scheduled workouts")

        # Default summary if no issues
        if not summary_parts:
            summary_parts.append("Health metrics look good overall")

        return {
            "summary": ". ".join(summary_parts) + ".",
            "recommendations": recommendations if recommendations else ["Keep up the good work!"],
            "risk_flags": risk_flags,
        }

    async def predict_injury_risk(self, user_id: str, days: int = 14) -> Dict[str, Any]:
        """
        Predict injury risk based on training volume trends, recovery, and soreness

        Args:
            user_id: User ID
            days: Number of days to analyze (default: 14)

        Returns:
            Injury risk assessment with score (0-100) and recommendations
        """
        try:
            cutoff_date = (date.today() - timedelta(days=days)).isoformat()

            # Fetch training volume trends
            training_result = self.supabase.table("workout_logs").select(
                "date, exercises"
            ).eq("user_id", user_id).gte("date", cutoff_date).order("date").execute()

            # Fetch recovery scores
            recovery_result = self.supabase.table("health_metrics").select(
                "date, value_numeric"
            ).eq("user_id", user_id).eq("metric_type", "recovery_score").gte(
                "date", cutoff_date
            ).order("date").execute()

            # Fetch soreness levels
            soreness_result = self.supabase.table("readiness_scores").select(
                "date, soreness"
            ).eq("user_id", user_id).gte("date", cutoff_date).order("date").execute()

            # Calculate weekly volumes
            weekly_volumes = {}
            for workout in training_result.data:
                workout_date = datetime.fromisoformat(workout["date"]).date()
                week = workout_date.isocalendar()[1]

                # Calculate total sets
                total_sets = sum(len(ex.get("sets", [])) for ex in workout.get("exercises", []))
                weekly_volumes[week] = weekly_volumes.get(week, 0) + total_sets

            # Analyze risk factors
            risk_score = 0
            risk_factors = []

            # 1. Volume spike detection
            if len(weekly_volumes) >= 2:
                weeks = sorted(weekly_volumes.keys())
                current_week = weekly_volumes[weeks[-1]]
                previous_week = weekly_volumes[weeks[-2]]

                if previous_week > 0:
                    volume_ratio = current_week / previous_week
                    if volume_ratio > self.INJURY_RISK_THRESHOLDS['volume_spike']:
                        risk_score += 30
                        risk_factors.append(f"Training volume increased {((volume_ratio - 1) * 100):.0f}% this week")

            # 2. Low recovery scores
            recent_recovery = [r["value_numeric"] for r in recovery_result.data[-7:]]
            if recent_recovery:
                avg_recovery = sum(recent_recovery) / len(recent_recovery)
                if avg_recovery < self.INJURY_RISK_THRESHOLDS['low_recovery']:
                    risk_score += 25
                    risk_factors.append(f"Average recovery score is low ({avg_recovery:.0f}%)")

            # 3. High soreness levels
            recent_soreness = [s["soreness"] for s in soreness_result.data[-7:] if s.get("soreness")]
            if recent_soreness:
                avg_soreness = sum(recent_soreness) / len(recent_soreness)
                if avg_soreness > self.INJURY_RISK_THRESHOLDS['high_soreness']:
                    risk_score += 20
                    risk_factors.append(f"Soreness levels are elevated ({avg_soreness:.1f}/10)")

            # 4. Consecutive high-intensity days
            consecutive_high = 0
            max_consecutive = 0
            for workout in sorted(training_result.data, key=lambda x: x["date"]):
                total_sets = sum(len(ex.get("sets", [])) for ex in workout.get("exercises", []))
                if total_sets > 15:
                    consecutive_high += 1
                    max_consecutive = max(max_consecutive, consecutive_high)
                else:
                    consecutive_high = 0

            if max_consecutive >= self.INJURY_RISK_THRESHOLDS['consecutive_high_intensity']:
                risk_score += 25
                risk_factors.append(f"{max_consecutive} consecutive high-intensity days detected")

            # Generate recommendations
            recommendations = []
            if risk_score >= 70:
                recommendations.append("Consider taking a deload week (reduce volume by 40-50%)")
                recommendations.append("Focus on mobility and recovery work")
                recommendations.append("Consult with a coach or physical therapist")
            elif risk_score >= 40:
                recommendations.append("Monitor soreness and recovery closely")
                recommendations.append("Add extra rest days if needed")
                recommendations.append("Reduce training intensity by 20-30%")
            else:
                recommendations.append("Continue current training approach")
                recommendations.append("Maintain focus on recovery and sleep")

            return {
                "risk_score": min(risk_score, 100),
                "risk_level": "high" if risk_score >= 70 else "moderate" if risk_score >= 40 else "low",
                "risk_factors": risk_factors,
                "recommendations": recommendations,
                "analyzed_days": days,
            }

        except Exception as e:
            print(f"Error predicting injury risk: {e}")
            return {
                "risk_score": 0,
                "risk_level": "unknown",
                "risk_factors": [],
                "recommendations": ["Unable to assess injury risk at this time"],
                "error": str(e),
            }

    async def optimize_recovery(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """
        Analyze recovery patterns and recommend optimal training intensity

        Args:
            user_id: User ID
            days: Number of days to analyze (default: 7)

        Returns:
            Recovery optimization recommendations
        """
        try:
            cutoff_date = (date.today() - timedelta(days=days)).isoformat()

            # Fetch sleep data
            sleep_result = self.supabase.table("sleep_sessions").select(
                "start_time, total_duration_minutes, sleep_score"
            ).eq("user_id", user_id).gte("start_time", cutoff_date).execute()

            # Fetch HRV data
            hrv_result = self.supabase.table("health_metrics").select(
                "date, value_numeric"
            ).eq("user_id", user_id).eq("metric_type", "hrv").gte(
                "date", cutoff_date
            ).execute()

            # Fetch recovery scores
            recovery_result = self.supabase.table("health_metrics").select(
                "date, value_numeric"
            ).eq("user_id", user_id).eq("metric_type", "recovery_score").gte(
                "date", cutoff_date
            ).execute()

            # Calculate averages
            avg_sleep_hours = 0
            if sleep_result.data:
                total_sleep_min = sum(s["total_duration_minutes"] for s in sleep_result.data)
                avg_sleep_hours = (total_sleep_min / len(sleep_result.data)) / 60

            avg_hrv = 0
            if hrv_result.data:
                avg_hrv = sum(h["value_numeric"] for h in hrv_result.data) / len(hrv_result.data)

            avg_recovery = 0
            if recovery_result.data:
                avg_recovery = sum(r["value_numeric"] for r in recovery_result.data) / len(recovery_result.data)

            # Generate recommendations
            recommendations = []
            intensity_recommendation = "moderate"

            # Sleep analysis
            if avg_sleep_hours < 7:
                recommendations.append(f"Increase sleep duration (currently {avg_sleep_hours:.1f}h, target 7-9h)")
                recommendations.append("Consider earlier bedtime or sleep hygiene improvements")
                intensity_recommendation = "low"
            elif avg_sleep_hours >= 8:
                recommendations.append("Sleep duration is excellent - maintain this pattern")

            # HRV analysis
            if avg_hrv > 0:
                if avg_hrv < 50:
                    recommendations.append("HRV is low - prioritize recovery and stress management")
                    intensity_recommendation = "low"
                elif avg_hrv > 70:
                    recommendations.append("HRV is strong - you can handle higher training loads")

            # Recovery score analysis
            if avg_recovery < 60:
                recommendations.append("Recovery is suboptimal - consider a rest day or deload")
                intensity_recommendation = "low"
            elif avg_recovery >= 80:
                recommendations.append("Recovery is excellent - good day for challenging workouts")
                intensity_recommendation = "high"
            else:
                recommendations.append("Recovery is moderate - stick to planned training")
                intensity_recommendation = "moderate"

            # Deload recommendation
            if avg_recovery < 50 and avg_sleep_hours < 7:
                recommendations.append("⚠️ Consider a deload week to allow full recovery")

            return {
                "avg_sleep_hours": round(avg_sleep_hours, 1),
                "avg_hrv": round(avg_hrv, 1),
                "avg_recovery_score": round(avg_recovery, 1),
                "recommended_intensity": intensity_recommendation,
                "recommendations": recommendations,
                "analyzed_days": days,
            }

        except Exception as e:
            print(f"Error optimizing recovery: {e}")
            return {
                "error": str(e),
                "recommendations": ["Unable to analyze recovery at this time"],
            }

    async def recommend_nutrition(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """
        Analyze nutrition data and recommend macro adjustments

        Args:
            user_id: User ID
            days: Number of days to analyze (default: 7)

        Returns:
            Nutrition recommendations
        """
        try:
            cutoff_date = (date.today() - timedelta(days=days)).isoformat()

            # Fetch nutrition data
            nutrition_result = self.supabase.table("daily_summaries").select(
                "date, calories_total, protein_grams, carbs_grams, fats_grams"
            ).eq("user_id", user_id).gte("date", cutoff_date).execute()

            # Fetch training volume
            training_result = self.supabase.table("workout_logs").select(
                "date, exercises"
            ).eq("user_id", user_id).gte("date", cutoff_date).execute()

            # Fetch user profile for goals
            profile_result = self.supabase.table("user_profiles").select(
                "goals, weight_kg"
            ).eq("user_id", user_id).single().execute()

            # Calculate averages
            avg_calories = 0
            avg_protein = 0
            avg_carbs = 0
            avg_fats = 0

            if nutrition_result.data:
                avg_calories = sum(n.get("calories_total", 0) for n in nutrition_result.data) / len(nutrition_result.data)
                avg_protein = sum(n.get("protein_grams", 0) for n in nutrition_result.data) / len(nutrition_result.data)
                avg_carbs = sum(n.get("carbs_grams", 0) for n in nutrition_result.data) / len(nutrition_result.data)
                avg_fats = sum(n.get("fats_grams", 0) for n in nutrition_result.data) / len(nutrition_result.data)

            # Calculate training volume
            total_sets = 0
            for workout in training_result.data:
                total_sets += sum(len(ex.get("sets", [])) for ex in workout.get("exercises", []))

            avg_sets_per_day = total_sets / days if days > 0 else 0

            # Get user goals and weight
            goals = profile_result.data.get("goals", []) if profile_result.data else []
            weight_kg = profile_result.data.get("weight_kg", 70) if profile_result.data else 70

            # Generate recommendations
            recommendations = []
            macro_targets = {}

            # Protein recommendations (based on training volume)
            protein_per_kg = avg_protein / weight_kg if weight_kg > 0 else 0
            if avg_sets_per_day > 10:  # High volume training
                target_protein_per_kg = 2.0
            else:
                target_protein_per_kg = 1.6

            target_protein = weight_kg * target_protein_per_kg
            macro_targets["protein_grams"] = round(target_protein)

            if protein_per_kg < target_protein_per_kg - 0.3:
                recommendations.append(f"Increase protein intake to {target_protein:.0f}g/day (currently {avg_protein:.0f}g)")
            elif protein_per_kg > target_protein_per_kg + 0.5:
                recommendations.append(f"Protein intake is high ({avg_protein:.0f}g) - consider reducing slightly")
            else:
                recommendations.append(f"Protein intake is optimal ({avg_protein:.0f}g/day)")

            # Carb recommendations (based on training volume and goals)
            if "muscle_gain" in goals or "strength" in goals:
                target_carbs_per_kg = 4.0 if avg_sets_per_day > 10 else 3.0
            elif "fat_loss" in goals:
                target_carbs_per_kg = 2.0
            else:
                target_carbs_per_kg = 3.0

            target_carbs = weight_kg * target_carbs_per_kg
            macro_targets["carbs_grams"] = round(target_carbs)

            carbs_per_kg = avg_carbs / weight_kg if weight_kg > 0 else 0
            if carbs_per_kg < target_carbs_per_kg - 0.5:
                recommendations.append(f"Increase carb intake to support training ({target_carbs:.0f}g/day target)")

            # Fat recommendations
            target_fats_per_kg = 1.0
            target_fats = weight_kg * target_fats_per_kg
            macro_targets["fats_grams"] = round(target_fats)

            # Calorie recommendations
            if "muscle_gain" in goals:
                target_calories = (target_protein * 4) + (target_carbs * 4) + (target_fats * 9) + 300
                recommendations.append(f"Target {target_calories:.0f} calories/day for muscle gain")
            elif "fat_loss" in goals:
                target_calories = (target_protein * 4) + (target_carbs * 4) + (target_fats * 9) - 500
                recommendations.append(f"Target {target_calories:.0f} calories/day for fat loss")
            else:
                target_calories = (target_protein * 4) + (target_carbs * 4) + (target_fats * 9)

            macro_targets["calories"] = round(target_calories)

            # Hydration reminder
            recommendations.append("Aim for 3-4L water daily, more on training days")

            return {
                "current_averages": {
                    "calories": round(avg_calories),
                    "protein_grams": round(avg_protein),
                    "carbs_grams": round(avg_carbs),
                    "fats_grams": round(avg_fats),
                },
                "macro_targets": macro_targets,
                "recommendations": recommendations,
                "analyzed_days": days,
            }

        except Exception as e:
            print(f"Error recommending nutrition: {e}")
            return {
                "error": str(e),
                "recommendations": ["Unable to analyze nutrition at this time"],
            }

