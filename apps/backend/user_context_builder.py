"""
User Context Builder for AI Prompts

This service fetches user data from Supabase and builds a comprehensive
context string to inject into AI system prompts. This ensures the AI has
full knowledge of the user's training history, injuries, recovery status,
and preferences.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from redis_client import (
    cache_user_context,
    get_cached_user_context,
    invalidate_user_context,
)

from supabase import Client


class UserContextBuilder:
    """Builds comprehensive user context for AI prompts"""

    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client

    async def build_context(self, user_id: str, use_cache: bool = True) -> str:
        """
        Build comprehensive user context string for AI system prompt

        Args:
            user_id: User's unique identifier
            use_cache: Whether to use cached context (default: True)

        Returns:
            Formatted context string to inject into system prompt
        """
        # Check cache first if enabled
        if use_cache:
            try:
                cached_context = get_cached_user_context(user_id)
                if cached_context:
                    print(f"✅ User context cache hit for user {user_id}")
                    return cached_context
            except Exception as e:
                print(f"⚠️  Cache retrieval failed: {e}")
                # Continue to build context if cache fails

        # Fetch all user data in parallel
        user_profile = await self._get_user_profile(user_id)
        active_injuries = await self._get_active_injuries(user_id)
        recent_workouts = await self._get_recent_workouts(user_id, days=7)
        weekly_volume = await self._calculate_weekly_volume(user_id)
        readiness = await self._get_latest_readiness(user_id)
        current_program = await self._get_current_program(user_id)
        recent_prs = await self._get_recent_prs(user_id, limit=5)
        recent_runs = await self._get_recent_runs(user_id, days=14)
        streaks = await self._get_user_streaks(user_id)
        badges = await self._get_user_badges(user_id)
        daily_metrics = await self._get_daily_metrics(user_id, days=7)
        nutrition_summary = await self._get_nutrition_summary(user_id, days=7)
        # NEW: Wearable data
        wearable_connections = await self._get_wearable_connections(user_id)
        health_metrics = await self._get_health_metrics(user_id, days=7)
        sleep_sessions = await self._get_sleep_sessions(user_id, days=7)
        daily_summaries = await self._get_daily_summaries(user_id, days=7)
        # NEW: Health snapshots
        latest_snapshot = await self._get_latest_health_snapshot(user_id)
        # NEW: User preferences
        user_preferences = await self._get_user_preferences(user_id)

        # Build context string
        context_parts = []

        # Header
        context_parts.append("**USER CONTEXT:**\n")

        # Training Profile
        if user_profile:
            context_parts.append("**Training Profile:**")
            context_parts.append(
                f"- Experience: {user_profile.get('experience_level', 'unknown')} ({user_profile.get('training_age', 'unknown')} training)"
            )
            context_parts.append(f"- Tier: {user_profile.get('tier', 'free')}")
            context_parts.append(f"- Goals: {', '.join(user_profile.get('goals', []))}")
            context_parts.append(f"- Age: {user_profile.get('age', 'unknown')}")
            context_parts.append("")

        # Current Program
        if current_program:
            context_parts.append("**Current Program:**")
            context_parts.append(f"- Program: {current_program.get('name', 'Custom')}")
            context_parts.append(
                f"- Week: {current_program.get('current_week', 'unknown')} of {current_program.get('total_weeks', 'unknown')}"
            )
            context_parts.append(f"- Focus: {current_program.get('focus', 'strength')}")
            context_parts.append("")

        # Weekly Volume
        if weekly_volume:
            context_parts.append("**Current Training Volume (This Week):**")
            for exercise, sets in weekly_volume.items():
                context_parts.append(f"- {exercise}: {sets} sets")
            context_parts.append("")

        # Recent Workouts
        if recent_workouts:
            context_parts.append("**Recent Workouts (Last 7 Days):**")
            for workout in recent_workouts[:3]:  # Show last 3 workouts
                date = workout.get("date", "unknown")
                exercises = workout.get("exercises", [])
                rpe = workout.get("avg_rpe", "N/A")
                notes = workout.get("notes", "")

                context_parts.append(f"\n**{date}:**")
                for ex in exercises[:5]:  # Show top 5 exercises
                    context_parts.append(f"  - {ex}")
                context_parts.append(f"  - Avg RPE: {rpe}/10")
                if notes:
                    context_parts.append(f'  - Notes: "{notes}"')
            context_parts.append("")

        # Active Injuries
        if active_injuries:
            context_parts.append("**Active Injuries:**")
            for injury in active_injuries:
                body_part = injury.get("body_part", "unknown")
                severity = injury.get("severity", "unknown")
                description = injury.get("description", "")
                reported_at = injury.get("reported_at", "unknown")
                status = injury.get("status", "active")
                days_since = self._calculate_days_since(reported_at)

                context_parts.append(f"- {body_part} ({severity}): {description}")
                context_parts.append(
                    f"  Reported: {reported_at} ({days_since} days ago)"
                )
                context_parts.append(f"  Status: {status}")
            context_parts.append("")

        # Current Readiness
        if readiness:
            context_parts.append("**Current Readiness (Today):**")
            context_parts.append(
                f"- Sleep Quality: {readiness.get('sleep_quality', 'N/A')}/10"
            )
            context_parts.append(f"- Soreness: {readiness.get('soreness', 'N/A')}/10")
            context_parts.append(f"- Stress: {readiness.get('stress', 'N/A')}/10")
            context_parts.append(f"- Energy: {readiness.get('energy', 'N/A')}/10")
            context_parts.append(
                f"- Overall Score: {readiness.get('score', 'N/A')}/100"
            )
            context_parts.append("")

        # Daily Metrics (from wearables)
        if daily_metrics:
            context_parts.append("**Wearable Data (Last 7 Days):**")

            # Group metrics by date
            metrics_by_date = {}
            for metric in daily_metrics:
                date_key = metric.get("date", "unknown")
                if date_key not in metrics_by_date:
                    metrics_by_date[date_key] = {}
                metric_type = metric.get("metric_type", "unknown")
                value = metric.get("value_numeric", 0)
                source = metric.get("source", "unknown")
                metrics_by_date[date_key][metric_type] = {"value": value, "source": source}

            # Show most recent 3 days
            sorted_dates = sorted(metrics_by_date.keys(), reverse=True)[:3]
            for date_key in sorted_dates:
                metrics = metrics_by_date[date_key]
                context_parts.append(f"\n**{date_key}:**")

                # Sleep metrics
                if "sleep_duration" in metrics:
                    sleep_hrs = metrics["sleep_duration"]["value"]
                    context_parts.append(f"  - Sleep: {sleep_hrs:.1f} hours ({metrics['sleep_duration']['source']})")

                # Recovery/HRV
                if "hrv" in metrics:
                    hrv = metrics["hrv"]["value"]
                    context_parts.append(f"  - HRV: {hrv:.0f} ms ({metrics['hrv']['source']})")

                if "recovery_score" in metrics:
                    recovery = metrics["recovery_score"]["value"]
                    context_parts.append(f"  - Recovery: {recovery:.0f}% ({metrics['recovery_score']['source']})")

                # Activity
                if "strain" in metrics:
                    strain = metrics["strain"]["value"]
                    context_parts.append(f"  - Strain: {strain:.1f} ({metrics['strain']['source']})")

                if "steps" in metrics:
                    steps = metrics["steps"]["value"]
                    context_parts.append(f"  - Steps: {steps:.0f} ({metrics['steps']['source']})")

            context_parts.append("")

        # Nutrition Summary
        if nutrition_summary:
            context_parts.append("**Nutrition (Last 7 Days):**")

            # Show most recent 3 days
            sorted_nutrition = sorted(nutrition_summary, key=lambda x: x.get("date", ""), reverse=True)[:3]
            for entry in sorted_nutrition:
                date_key = entry.get("date", "unknown")
                calories = entry.get("calories", 0)
                protein = entry.get("protein_g", 0)
                carbs = entry.get("carbs_g", 0)
                fat = entry.get("fat_g", 0)
                source = entry.get("source", "unknown")

                context_parts.append(f"\n**{date_key}:** ({source})")
                if calories:
                    context_parts.append(f"  - Calories: {calories:.0f} kcal")
                if protein:
                    context_parts.append(f"  - Protein: {protein:.0f}g")
                if carbs:
                    context_parts.append(f"  - Carbs: {carbs:.0f}g")
                if fat:
                    context_parts.append(f"  - Fat: {fat:.0f}g")

            context_parts.append("")

        # Recent PRs
        if recent_prs:
            context_parts.append("**Recent Personal Records (Last 30 Days):**")
            for pr in recent_prs:
                exercise = pr.get("exercise_name", "Unknown")
                weight = pr.get("weight", 0)
                reps = pr.get("reps", 0)
                one_rm = pr.get("one_rm", 0)
                achieved_at = pr.get("achieved_at", "unknown")
                context_parts.append(
                    f"- {exercise}: {weight}lbs x {reps} reps (Est. 1RM: {one_rm}lbs) - {achieved_at}"
                )
            context_parts.append("")

        # Recent Runs (Premium feature)
        if recent_runs:
            context_parts.append("**Recent Runs (Last 14 Days):**")
            for run in recent_runs[:5]:  # Show last 5 runs
                distance = run.get("distance", 0)
                duration = run.get("duration", 0)
                pace = run.get("pace", 0)
                date = run.get("start_time", "unknown")
                context_parts.append(
                    f"- {date}: {distance} miles in {duration} min (Pace: {pace} min/mile)"
                )
            context_parts.append("")

        # Streaks (Premium feature)
        if streaks:
            context_parts.append("**Current Streaks:**")
            for streak in streaks:
                streak_type = streak.get("streak_type", "unknown")
                current = streak.get("current_count", 0)
                longest = streak.get("longest_count", 0)
                context_parts.append(
                    f"- {streak_type}: {current} days (Longest: {longest} days)"
                )
            context_parts.append("")

        # Badges (Premium feature)
        if badges:
            context_parts.append("**Recent Badges Earned:**")
            for badge in badges[:5]:  # Show last 5 badges
                badge_name = badge.get("badge_name", "Unknown")
                earned_at = badge.get("earned_at", "unknown")
                context_parts.append(f"- {badge_name} - {earned_at}")
            context_parts.append("")

        # Wearable Connections
        if wearable_connections:
            context_parts.append("**Connected Wearables:**")
            for conn in wearable_connections:
                provider = conn.get("provider", "unknown")
                last_sync = conn.get("last_sync_at", "never")
                status = conn.get("sync_status", "unknown")
                context_parts.append(f"- {provider.upper()}: Last sync {last_sync} ({status})")
            context_parts.append("")

        # Health Metrics (Recovery & Readiness)
        if health_metrics:
            context_parts.append("**Health Metrics (Last 7 Days):**")

            # Group by metric type and show latest value
            metrics_by_type = {}
            for metric in health_metrics:
                metric_type = metric.get("metric_type", "unknown")
                if metric_type not in metrics_by_type:
                    metrics_by_type[metric_type] = metric

            # Show key recovery metrics
            if "recovery_score" in metrics_by_type:
                recovery = metrics_by_type["recovery_score"]
                value = recovery.get("value_numeric", 0)
                source = recovery.get("source", "unknown")
                context_parts.append(f"- Recovery Score: {value}% ({source})")

            if "hrv" in metrics_by_type:
                hrv = metrics_by_type["hrv"]
                value = hrv.get("value_numeric", 0)
                source = hrv.get("source", "unknown")
                context_parts.append(f"- HRV: {value}ms ({source})")

            if "resting_hr" in metrics_by_type:
                rhr = metrics_by_type["resting_hr"]
                value = rhr.get("value_numeric", 0)
                source = rhr.get("source", "unknown")
                context_parts.append(f"- Resting HR: {value} bpm ({source})")

            if "spo2" in metrics_by_type:
                spo2 = metrics_by_type["spo2"]
                value = spo2.get("value_numeric", 0)
                source = spo2.get("source", "unknown")
                context_parts.append(f"- SpO2: {value}% ({source})")

            context_parts.append("")

        # Sleep Data
        if sleep_sessions:
            context_parts.append("**Recent Sleep (Last 7 Days):**")

            # Show last 3 sleep sessions
            sorted_sleep = sorted(sleep_sessions, key=lambda x: x.get("start_time", ""), reverse=True)[:3]
            for session in sorted_sleep:
                date = session.get("start_time", "unknown")[:10]  # Extract date
                total_min = session.get("total_duration_minutes", 0)
                total_hrs = total_min / 60
                score = session.get("sleep_score", 0)
                efficiency = session.get("sleep_efficiency", 0)
                source = session.get("source", "unknown")

                context_parts.append(f"\n**{date}:** ({source})")
                context_parts.append(f"  - Duration: {total_hrs:.1f} hours")
                if score:
                    context_parts.append(f"  - Sleep Score: {score}%")
                if efficiency:
                    context_parts.append(f"  - Efficiency: {efficiency}%")

                # Sleep stages
                deep = session.get("deep_sleep_minutes", 0)
                rem = session.get("rem_sleep_minutes", 0)
                light = session.get("light_sleep_minutes", 0)
                if deep or rem or light:
                    context_parts.append(f"  - Stages: Deep {deep}min, REM {rem}min, Light {light}min")

            context_parts.append("")

        # Daily Summaries
        if daily_summaries:
            context_parts.append("**Daily Activity Summary (Last 7 Days):**")

            # Show last 3 days
            sorted_summaries = sorted(daily_summaries, key=lambda x: x.get("date", ""), reverse=True)[:3]
            for summary in sorted_summaries:
                date = summary.get("date", "unknown")
                steps = summary.get("steps", 0)
                active_min = summary.get("active_minutes", 0)
                calories = summary.get("calories_total", 0)
                strain = summary.get("strain_score", 0)

                context_parts.append(f"\n**{date}:**")
                if steps:
                    context_parts.append(f"  - Steps: {steps:,}")
                if active_min:
                    context_parts.append(f"  - Active Minutes: {active_min}")
                if calories:
                    context_parts.append(f"  - Calories: {calories}")
                if strain:
                    context_parts.append(f"  - Strain Score: {strain}")

            context_parts.append("")

        # Health Snapshot (AI-Generated Daily Summary)
        if latest_snapshot:
            context_parts.append("**Latest Health Snapshot:**")
            snapshot_date = latest_snapshot.get("date", "unknown")
            ai_summary = latest_snapshot.get("ai_summary", "")
            recommendations = latest_snapshot.get("ai_recommendations", [])
            risk_flags = latest_snapshot.get("risk_flags", [])
            completeness = latest_snapshot.get("data_completeness_score", 0)

            context_parts.append(f"Date: {snapshot_date} (Data Completeness: {completeness}%)")

            if ai_summary:
                context_parts.append(f"\n**AI Summary:** {ai_summary}")

            if recommendations:
                context_parts.append("\n**Recommendations:**")
                for rec in recommendations[:3]:  # Show top 3
                    context_parts.append(f"  - {rec}")

            if risk_flags:
                context_parts.append("\n**Risk Flags:**")
                for flag in risk_flags:
                    context_parts.append(f"  ⚠️ {flag}")

            context_parts.append("")

        # User Preferences
        if user_preferences:
            context_parts.append("**User Preferences:**")

            # Workout preferences
            duration = user_preferences.get("preferred_workout_duration_min")
            if duration:
                context_parts.append(f"- Preferred Workout Duration: {duration} minutes")

            max_workouts = user_preferences.get("max_workouts_per_week")
            if max_workouts:
                context_parts.append(f"- Max Workouts Per Week: {max_workouts}")

            workout_time = user_preferences.get("preferred_workout_time")
            if workout_time:
                context_parts.append(f"- Preferred Training Time: {workout_time}")

            # Equipment
            available_equipment = user_preferences.get("available_equipment", [])
            if available_equipment:
                context_parts.append(f"- Available Equipment: {', '.join(available_equipment)}")

            # Exercise preferences
            favorite_exercises = user_preferences.get("favorite_exercises", [])
            if favorite_exercises:
                context_parts.append(f"- Favorite Exercises: {', '.join(favorite_exercises)}")

            disliked_exercises = user_preferences.get("disliked_exercises", [])
            if disliked_exercises:
                context_parts.append(f"- Disliked Exercises: {', '.join(disliked_exercises)} (AVOID)")

            exercise_restrictions = user_preferences.get("exercise_restrictions", {})
            if exercise_restrictions:
                context_parts.append("- Exercise Restrictions:")
                for exercise, reason in exercise_restrictions.items():
                    context_parts.append(f"  * {exercise}: {reason}")

            # Training style
            prefers_supersets = user_preferences.get("prefers_supersets", False)
            if prefers_supersets:
                context_parts.append("- Prefers Supersets: Yes")

            prefers_dropsets = user_preferences.get("prefers_dropsets", False)
            if prefers_dropsets:
                context_parts.append("- Prefers Dropsets: Yes")

            # Coaching style
            coaching_style = user_preferences.get("coaching_style")
            if coaching_style:
                context_parts.append(f"- Coaching Style: {coaching_style}")

            context_parts.append("")

        # Instructions for AI
        context_parts.append(
            "**Important:** Use this context to provide personalized advice. Consider their injury history, current volume, recovery status, experience level, recent PRs, training consistency, sleep quality, wearable data, health snapshot insights, and user preferences when making recommendations. Strictly respect user preferences (equipment, exercise dislikes, coaching style)."
        )

        context = "\n".join(context_parts)

        # Cache the built context (1 hour TTL)
        if use_cache:
            try:
                cache_user_context(user_id, context, ttl=3600)
                print(f"✅ Cached user context for user {user_id}")
            except Exception as e:
                print(f"⚠️  Failed to cache user context: {e}")

        return context

    def invalidate_cache(self, user_id: str):
        """
        Invalidate cached user context.

        Call this after:
        - Workout logged
        - Injury reported/updated
        - Program changed
        - PR achieved
        - Profile updated
        """
        try:
            invalidate_user_context(user_id)
            print(f"✅ Invalidated user context cache for user {user_id}")
        except Exception as e:
            print(f"⚠️  Failed to invalidate cache: {e}")

    async def _get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user profile data"""
        try:
            result = (
                self.supabase.table("user_profiles")
                .select("*")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching user profile: {e}")
            return None

    async def _get_active_injuries(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch active injuries"""
        try:
            result = (
                self.supabase.table("injury_logs")
                .select("*")
                .eq("user_id", user_id)
                .in_("status", ["active", "recovering"])
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching active injuries: {e}")
            return []

    async def _get_recent_workouts(
        self, user_id: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Fetch recent workouts"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            result = (
                self.supabase.table("workouts")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time", cutoff_date)
                .order("start_time", desc=True)
                .execute()
            )

            # Format workouts with exercise details
            workouts = []
            for workout in result.data or []:
                # Fetch workout logs (sets) for this workout
                logs_result = (
                    self.supabase.table("workout_logs")
                    .select("*")
                    .eq("workout_id", workout["id"])
                    .execute()
                )
                logs = logs_result.data or []

                # Get unique exercise IDs
                exercise_ids = list(
                    set([log["exercise_id"] for log in logs if log.get("exercise_id")])
                )

                # Fetch exercise names
                exercise_names = {}
                if exercise_ids:
                    exercises_result = (
                        self.supabase.table("exercises")
                        .select("id, original_name")
                        .in_("id", exercise_ids)
                        .execute()
                    )
                    for ex in exercises_result.data or []:
                        exercise_names[ex["id"]] = ex["original_name"]

                # Group by exercise and aggregate sets
                exercise_data = {}
                total_rpe = 0
                rpe_count = 0

                for log in logs:
                    exercise_id = log.get("exercise_id")
                    exercise_name = exercise_names.get(exercise_id, "Unknown")
                    weight = log.get("weight_used", 0)
                    reps = log.get("reps_completed", 0)
                    rpe = log.get("rpe")

                    # Group by exercise
                    if exercise_name not in exercise_data:
                        exercise_data[exercise_name] = {
                            "sets": 0,
                            "weight": weight,
                            "reps": reps,
                            "rpe": rpe,
                        }
                    exercise_data[exercise_name]["sets"] += 1

                    if rpe:
                        total_rpe += rpe
                        rpe_count += 1

                # Format exercise strings
                exercise_strings = []
                for ex_name, data in exercise_data.items():
                    ex_str = f"{ex_name} {data['sets']}x{data['reps']}"
                    if data["weight"]:
                        ex_str += f" @ {data['weight']}lbs"
                    if data["rpe"]:
                        ex_str += f" (RPE {data['rpe']})"
                    exercise_strings.append(ex_str)

                avg_rpe = round(total_rpe / rpe_count, 1) if rpe_count > 0 else None

                workouts.append(
                    {
                        "date": workout.get("start_time", "unknown"),
                        "exercises": exercise_strings,
                        "avg_rpe": avg_rpe,
                        "notes": workout.get("notes", ""),
                    }
                )

            return workouts
        except Exception as e:
            print(f"Error fetching recent workouts: {e}")
            return []

    async def _calculate_weekly_volume(self, user_id: str) -> Dict[str, int]:
        """Calculate weekly training volume by exercise"""
        try:
            # Get workouts from last 7 days
            cutoff_date = (datetime.now() - timedelta(days=7)).isoformat()
            workouts_result = (
                self.supabase.table("workouts")
                .select("id")
                .eq("user_id", user_id)
                .gte("start_time", cutoff_date)
                .execute()
            )

            if not workouts_result.data:
                return {}

            workout_ids = [w["id"] for w in workouts_result.data]

            # Get all workout logs from these workouts (each log is one set)
            logs_result = (
                self.supabase.table("workout_logs")
                .select("exercise_id")
                .in_("workout_id", workout_ids)
                .execute()
            )

            # Get unique exercise IDs
            exercise_ids = list(
                set(
                    [
                        log["exercise_id"]
                        for log in (logs_result.data or [])
                        if log.get("exercise_id")
                    ]
                )
            )

            # Fetch exercise names
            exercise_names = {}
            if exercise_ids:
                exercises_result = (
                    self.supabase.table("exercises")
                    .select("id, original_name")
                    .in_("id", exercise_ids)
                    .execute()
                )
                for ex in exercises_result.data or []:
                    exercise_names[ex["id"]] = ex["original_name"]

            # Count sets by exercise
            volume = {}
            for log in logs_result.data or []:
                exercise_id = log.get("exercise_id")
                ex_name = exercise_names.get(exercise_id, "Unknown")

                # Normalize exercise names (e.g., "Bench Press" and "Barbell Bench Press" -> "Bench Press")
                normalized_name = self._normalize_exercise_name(ex_name)

                if normalized_name in volume:
                    volume[normalized_name] += 1  # Each log is one set
                else:
                    volume[normalized_name] = 1

            return volume
        except Exception as e:
            print(f"Error calculating weekly volume: {e}")
            return {}

    async def _get_latest_readiness(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch latest readiness check-in"""
        try:
            result = (
                self.supabase.table("readiness_scores")
                .select("*")
                .eq("user_id", user_id)
                .order("date", desc=True)
                .limit(1)
                .single()
                .execute()
            )
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching readiness: {e}")
            return None

    async def _get_current_program(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch current training program"""
        try:
            result = (
                self.supabase.table("generated_programs")
                .select("*")
                .eq("user_profile_id", user_id)
                .eq("is_active", True)
                .single()
                .execute()
            )
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching current program: {e}")
            return None

    async def _get_recent_prs(
        self, user_id: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Fetch recent personal records"""
        try:
            # Get PRs from last 30 days
            cutoff_date = (datetime.now() - timedelta(days=30)).isoformat()
            result = (
                self.supabase.table("pr_history")
                .select("*")
                .eq("user_id", user_id)
                .gte("achieved_at", cutoff_date)
                .order("achieved_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent PRs: {e}")
            return []

    async def _get_daily_metrics(
        self, user_id: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Fetch daily metrics from wearables (last N days)"""
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
            print(f"Error fetching daily metrics: {e}")
            return []

    async def _get_nutrition_summary(
        self, user_id: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Fetch nutrition summaries (last N days)"""
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
            print(f"Error fetching nutrition summary: {e}")
            return []

    async def _get_recent_runs(
        self, user_id: str, days: int = 14
    ) -> List[Dict[str, Any]]:
        """Fetch recent running workouts"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            result = (
                self.supabase.table("runs")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time", cutoff_date)
                .order("start_time", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent runs: {e}")
            return []

    async def _get_user_streaks(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user's current streaks"""
        try:
            result = (
                self.supabase.table("user_streaks")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching user streaks: {e}")
            return []

    async def _get_user_badges(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user's recently earned badges"""
        try:
            result = (
                self.supabase.table("user_badges")
                .select("*")
                .eq("user_id", user_id)
                .order("earned_at", desc=True)
                .limit(10)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching user badges: {e}")
            return []

    def _normalize_exercise_name(self, name: str) -> str:
        """Normalize exercise names for volume tracking"""
        # Remove common prefixes
        name = name.replace("Barbell ", "").replace("Dumbbell ", "").replace("DB ", "")

        # Common exercise mappings
        mappings = {
            "Bench Press": "Bench Press",
            "Squat": "Squat",
            "Deadlift": "Deadlift",
            "Overhead Press": "Overhead Press",
            "OHP": "Overhead Press",
            "Row": "Rows",
            "Pull-up": "Pull-ups",
            "Pullup": "Pull-ups",
        }

        for key, value in mappings.items():
            if key.lower() in name.lower():
                return value

        return name

    def _calculate_days_since(self, date_str: str) -> int:
        """Calculate days since a given date"""
        try:
            date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            now = datetime.now(date.tzinfo)
            return (now - date).days
        except Exception:
            return 0

    async def _get_wearable_connections(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user's connected wearable providers"""
        try:
            result = (
                self.supabase.table("wearable_provider_connections")
                .select("provider, last_sync_at, sync_status")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching wearable connections: {e}")
            return []

    async def _get_health_metrics(
        self, user_id: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Fetch health metrics from wearables (last N days)"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
            result = (
                self.supabase.table("health_metrics")
                .select("*")
                .eq("user_id", user_id)
                .gte("date", cutoff_date)
                .order("date", desc=True)
                .order("source_priority", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching health metrics: {e}")
            return []

    async def _get_sleep_sessions(
        self, user_id: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Fetch sleep sessions from wearables (last N days)"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
            result = (
                self.supabase.table("sleep_sessions")
                .select("*")
                .eq("user_id", user_id)
                .gte("start_time", cutoff_date)
                .order("start_time", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching sleep sessions: {e}")
            return []

    async def _get_daily_summaries(
        self, user_id: str, days: int = 7
    ) -> List[Dict[str, Any]]:
        """Fetch daily summaries from wearables (last N days)"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).date().isoformat()
            result = (
                self.supabase.table("daily_summaries")
                .select("*")
                .eq("user_id", user_id)
                .gte("date", cutoff_date)
                .order("date", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching daily summaries: {e}")
            return []

    async def _get_latest_health_snapshot(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch the latest health snapshot for the user"""
        try:
            result = (
                self.supabase.table("health_snapshots")
                .select("*")
                .eq("user_id", user_id)
                .order("date", desc=True)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching health snapshot: {e}")
            return None

    async def _get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user preferences"""
        try:
            result = (
                self.supabase.table("user_preferences")
                .select("*")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching user preferences: {e}")
            return None
