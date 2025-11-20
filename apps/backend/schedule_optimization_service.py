"""
Schedule Optimization Service

Provides AI-powered schedule suggestions based on:
- User adherence patterns
- Readiness/recovery data
- Availability windows
- Program structure and periodization
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from openai import OpenAI
from supabase import Client


class ScheduleOptimizationService:
    """AI-powered schedule optimization and conflict detection"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        # Use Grok 4 Fast for schedule optimization
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def check_conflicts(
        self, user_id: str, date: str, exclude_workout_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check for scheduling conflicts on a specific date

        Args:
            user_id: User ID
            date: Date to check (YYYY-MM-DD)
            exclude_workout_id: Optional workout ID to exclude from conflict check

        Returns:
            Dict with conflict status and details
        """
        try:
            # Use Supabase function to check conflicts
            result = self.supabase.rpc(
                "check_schedule_conflicts",
                {
                    "p_user_id": user_id,
                    "p_date": date,
                    "p_exclude_workout_id": exclude_workout_id,
                },
            ).execute()

            conflicts = result.data or []

            # Calculate total duration (including warmup/cooldown) and intensity
            total_duration = 0
            for c in conflicts:
                base_duration = c.get("estimated_duration", 0)
                warmup_duration = c.get("warmup_duration_min", 0)
                cooldown_duration = c.get("cooldown_duration_min", 0)
                total_duration += base_duration + warmup_duration + cooldown_duration

            high_intensity_count = sum(
                1 for c in conflicts if "high" in c.get("workout_name", "").lower()
            )

            has_conflict = len(conflicts) > 1 or total_duration > 120

            return {
                "has_conflict": has_conflict,
                "conflict_type": self._determine_conflict_type(
                    len(conflicts), total_duration, high_intensity_count
                ),
                "total_duration_minutes": total_duration,
                "workout_count": len(conflicts),
                "workouts": conflicts,
                "warnings": self._generate_conflict_warnings(
                    len(conflicts), total_duration, high_intensity_count
                ),
            }

        except Exception as e:
            print(f"Error checking conflicts: {e}")
            return {
                "has_conflict": False,
                "error": str(e),
            }

    def _determine_conflict_type(
        self, workout_count: int, total_duration: int, high_intensity_count: int
    ) -> Optional[str]:
        """Determine the type of scheduling conflict"""
        if workout_count > 2:
            return "too_many_workouts"
        elif total_duration > 180:
            return "excessive_duration"
        elif high_intensity_count > 1:
            return "high_intensity_cluster"
        elif total_duration > 120:
            return "duration_warning"
        return None

    def _generate_conflict_warnings(
        self, workout_count: int, total_duration: int, high_intensity_count: int
    ) -> List[str]:
        """Generate human-readable conflict warnings"""
        warnings = []

        if workout_count > 2:
            warnings.append(
                f"You have {workout_count} workouts scheduled on this day. Consider spreading them out."
            )

        if total_duration > 180:
            warnings.append(
                f"Total workout time is {total_duration} minutes. This may be too much for one day."
            )
        elif total_duration > 120:
            warnings.append(
                f"Total workout time is {total_duration} minutes. Make sure you have adequate recovery."
            )

        if high_intensity_count > 1:
            warnings.append(
                "Multiple high-intensity workouts on the same day may lead to overtraining."
            )

        return warnings

    def get_availability_windows(
        self, user_id: str, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """
        Get availability windows for a date range

        Args:
            user_id: User ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            List of availability windows
        """
        try:
            result = self.supabase.rpc(
                "get_availability_windows",
                {
                    "p_user_id": user_id,
                    "p_start_date": start_date,
                    "p_end_date": end_date,
                },
            ).execute()

            return result.data or []

        except Exception as e:
            print(f"Error fetching availability windows: {e}")
            return []

    def create_availability_window(
        self,
        user_id: str,
        start_date: str,
        end_date: str,
        availability_type: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an availability window and trigger schedule adjustment suggestions

        Args:
            user_id: User ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            availability_type: Type (travel|vacation|injury|other)
            notes: Optional notes

        Returns:
            Created availability window
        """
        try:
            # Insert availability window
            result = (
                self.supabase.table("availability_windows")
                .insert(
                    {
                        "user_id": user_id,
                        "start_date": start_date,
                        "end_date": end_date,
                        "availability_type": availability_type,
                        "notes": notes,
                    }
                )
                .execute()
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error creating availability window: {e}")
            raise

    def generate_schedule_suggestions(
        self, user_id: str, user_context: str, rag_context: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate AI-powered schedule optimization suggestions

        Args:
            user_id: User ID
            user_context: User context from UserContextBuilder
            rag_context: Optional RAG context for scheduling best practices

        Returns:
            List of schedule suggestions
        """
        try:
            # Get upcoming scheduled workouts (next 4 weeks)
            today = datetime.now().date()
            end_date = today + timedelta(days=28)

            scheduled_workouts = (
                self.supabase.table("scheduled_workouts")
                .select("*, workout_templates(*)")
                .eq("user_id", user_id)
                .gte("scheduled_date", today.isoformat())
                .lte("scheduled_date", end_date.isoformat())
                .eq("status", "scheduled")
                .order("scheduled_date")
                .execute()
            )

            workouts = scheduled_workouts.data or []

            if not workouts:
                return []

            # Get availability windows
            availability = self.get_availability_windows(
                user_id, today.isoformat(), end_date.isoformat()
            )

            # Build prompt for AI
            prompt = self._build_optimization_prompt(
                user_context, workouts, availability, rag_context
            )

            # Call Grok for suggestions
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert strength and conditioning coach analyzing training schedules. Provide actionable schedule optimization suggestions in JSON format.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            suggestions_json = response.choices[0].message.content
            import json

            suggestions_data = json.loads(suggestions_json)
            suggestions = suggestions_data.get("suggestions", [])

            # Store suggestions in database
            stored_suggestions = []
            for suggestion in suggestions:
                stored = self._store_suggestion(user_id, suggestion)
                if stored:
                    stored_suggestions.append(stored)

            return stored_suggestions

        except Exception as e:
            print(f"Error generating schedule suggestions: {e}")
            return []

    def _build_optimization_prompt(
        self,
        user_context: str,
        workouts: List[Dict[str, Any]],
        availability: List[Dict[str, Any]],
        rag_context: Optional[str],
    ) -> str:
        """Build prompt for schedule optimization"""
        prompt_parts = [
            "# Schedule Optimization Task",
            "",
            "Analyze the user's upcoming training schedule and provide optimization suggestions.",
            "",
            "## User Context",
            user_context,
            "",
            "## Upcoming Scheduled Workouts",
        ]

        for workout in workouts:
            template = workout.get("workout_templates", {})
            prompt_parts.append(
                f"- {workout['scheduled_date']}: {template.get('name', 'Workout')} "
                f"({template.get('estimated_duration', 60)} min, {template.get('difficulty', 'moderate')})"
            )

        if availability:
            prompt_parts.append("")
            prompt_parts.append("## Availability Constraints")
            for window in availability:
                prompt_parts.append(
                    f"- {window['availability_type'].title()}: {window['start_date']} to {window['end_date']}"
                )

        if rag_context:
            prompt_parts.append("")
            prompt_parts.append("## Scheduling Best Practices")
            prompt_parts.append(rag_context)

        prompt_parts.extend(
            [
                "",
                "## Output Format",
                "Provide suggestions as JSON:",
                "{",
                '  "suggestions": [',
                "    {",
                '      "suggestion_type": "reschedule|deload|swap|skip|compress",',
                '      "affected_workout_ids": ["uuid1", "uuid2"],',
                '      "reasoning": "Clear explanation",',
                '      "confidence": 0.85,',
                '      "metadata": {"suggested_date": "2025-01-20", "priority": "high"}',
                "    }",
                "  ]",
                "}",
                "",
                "Focus on:",
                "1. Conflicts with availability windows",
                "2. Recovery between high-intensity sessions",
                "3. Periodization and deload timing",
                "4. Adherence patterns and realistic scheduling",
            ]
        )

        return "\n".join(prompt_parts)

    def _store_suggestion(
        self, user_id: str, suggestion: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Store a schedule suggestion in the database"""
        try:
            result = (
                self.supabase.table("schedule_adjustment_suggestions")
                .insert(
                    {
                        "user_id": user_id,
                        "suggestion_type": suggestion.get("suggestion_type"),
                        "affected_workout_ids": suggestion.get("affected_workout_ids", []),
                        "reasoning": suggestion.get("reasoning"),
                        "confidence": suggestion.get("confidence"),
                        "metadata": suggestion.get("metadata", {}),
                        "status": "pending",
                    }
                )
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as e:
            print(f"Error storing suggestion: {e}")
            return None

