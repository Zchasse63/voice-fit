"""
Warmup/Cooldown Generation Service

Generates personalized warmup and cooldown routines based on:
- Workout type and focus
- User injuries and mobility issues
- Sport type
- User preferences
"""

import os
import json
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class WarmupCooldownService:
    """AI-powered warmup/cooldown generation"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def generate_warmup(
        self,
        user_id: str,
        workout_focus: str,
        sport_type: Optional[str] = None,
        duration_min: int = 10,
    ) -> Dict[str, Any]:
        """
        Generate personalized warmup routine

        Args:
            user_id: User ID
            workout_focus: Workout focus (upper_body|lower_body|full_body|cardio)
            sport_type: Optional sport type
            duration_min: Target duration in minutes

        Returns:
            {
                "template_name": str,
                "total_duration_min": int,
                "phases": [
                    {
                        "phase_name": str,
                        "duration_min": int,
                        "movements": [
                            {"name": str, "reps": int, "sets": int, "duration_sec": int, "notes": str}
                        ]
                    }
                ]
            }
        """
        try:
            # Get user injuries and mobility issues
            user_context = self._get_user_context(user_id)

            # Get base template
            base_template = self._get_base_template("warmup", sport_type, workout_focus)

            # If user has injuries or mobility issues, personalize
            if user_context.get("injuries") or user_context.get("mobility_issues"):
                return self._personalize_warmup(
                    base_template, user_context, workout_focus, duration_min
                )

            return base_template

        except Exception as e:
            print(f"Error generating warmup: {e}")
            return self._get_default_warmup(workout_focus, duration_min)

    def generate_cooldown(
        self,
        user_id: str,
        workout_focus: str,
        sport_type: Optional[str] = None,
        duration_min: int = 10,
    ) -> Dict[str, Any]:
        """
        Generate personalized cooldown routine

        Args:
            user_id: User ID
            workout_focus: Workout focus
            sport_type: Optional sport type
            duration_min: Target duration in minutes

        Returns:
            Cooldown routine dict (same structure as warmup)
        """
        try:
            # Get user injuries and mobility issues
            user_context = self._get_user_context(user_id)

            # Get base template
            base_template = self._get_base_template("cooldown", sport_type, workout_focus)

            # If user has injuries or mobility issues, personalize
            if user_context.get("injuries") or user_context.get("mobility_issues"):
                return self._personalize_cooldown(
                    base_template, user_context, workout_focus, duration_min
                )

            return base_template

        except Exception as e:
            print(f"Error generating cooldown: {e}")
            return self._get_default_cooldown(workout_focus, duration_min)

    def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get user injuries and mobility issues"""
        try:
            # Get active injuries
            injuries_result = (
                self.supabase.table("injury_logs")
                .select("body_part, severity, description")
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )

            injuries = injuries_result.data if injuries_result.data else []

            # Get user preferences for mobility issues
            prefs_result = (
                self.supabase.table("user_preferences")
                .select("exercise_restrictions")
                .eq("user_id", user_id)
                .single()
                .execute()
            )

            mobility_issues = []
            if prefs_result.data:
                restrictions = prefs_result.data.get("exercise_restrictions", {})
                mobility_issues = [
                    {"area": k, "issue": v}
                    for k, v in restrictions.items()
                    if "mobility" in v.lower() or "flexibility" in v.lower()
                ]

            return {"injuries": injuries, "mobility_issues": mobility_issues}

        except Exception as e:
            print(f"Error getting user context: {e}")
            return {"injuries": [], "mobility_issues": []}

    def _get_base_template(
        self, template_type: str, sport_type: Optional[str], workout_focus: str
    ) -> Dict[str, Any]:
        """Get base warmup/cooldown template"""
        try:
            # Try to find sport-specific template first
            query = (
                self.supabase.table("warmup_cooldown_templates")
                .select("*")
                .eq("template_type", template_type)
            )

            if sport_type:
                query = query.eq("sport_type", sport_type)
            else:
                query = query.is_("sport_type", "null")

            query = query.eq("workout_focus", workout_focus)

            result = query.limit(1).execute()

            if result.data:
                template = result.data[0]
                return {
                    "template_name": template["template_name"],
                    "total_duration_min": template["total_duration_min"],
                    "phases": template["phases"],
                }

            # Fall back to default template
            default_result = (
                self.supabase.table("warmup_cooldown_templates")
                .select("*")
                .eq("template_type", template_type)
                .eq("is_default", True)
                .limit(1)
                .execute()
            )

            if default_result.data:
                template = default_result.data[0]
                return {
                    "template_name": template["template_name"],
                    "total_duration_min": template["total_duration_min"],
                    "phases": template["phases"],
                }

            # Ultimate fallback
            return (
                self._get_default_warmup(workout_focus, 10)
                if template_type == "warmup"
                else self._get_default_cooldown(workout_focus, 10)
            )

        except Exception as e:
            print(f"Error getting base template: {e}")
            return (
                self._get_default_warmup(workout_focus, 10)
                if template_type == "warmup"
                else self._get_default_cooldown(workout_focus, 10)
            )

    def _personalize_warmup(
        self,
        base_template: Dict[str, Any],
        user_context: Dict[str, Any],
        workout_focus: str,
        duration_min: int,
    ) -> Dict[str, Any]:
        """Personalize warmup based on user injuries and mobility"""
        try:
            # Build personalization prompt
            prompt = f"""Personalize this warmup routine for a user with the following context:

Base warmup template:
{json.dumps(base_template, indent=2)}

User context:
- Injuries: {json.dumps(user_context.get('injuries', []))}
- Mobility issues: {json.dumps(user_context.get('mobility_issues', []))}
- Workout focus: {workout_focus}
- Target duration: {duration_min} minutes

Modify the warmup to:
1. Avoid movements that stress injured areas
2. Add mobility work for problem areas
3. Maintain the target duration
4. Keep the same phase structure

Return the modified warmup in the same JSON format."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert strength coach and physical therapist. Personalize warmup routines to accommodate injuries and mobility limitations while maintaining effectiveness.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            personalized = json.loads(response.choices[0].message.content)
            return personalized

        except Exception as e:
            print(f"Error personalizing warmup: {e}")
            return base_template

    def _personalize_cooldown(
        self,
        base_template: Dict[str, Any],
        user_context: Dict[str, Any],
        workout_focus: str,
        duration_min: int,
    ) -> Dict[str, Any]:
        """Personalize cooldown based on user injuries and mobility"""
        # Similar to warmup personalization
        try:
            prompt = f"""Personalize this cooldown routine for a user with the following context:

Base cooldown template:
{json.dumps(base_template, indent=2)}

User context:
- Injuries: {json.dumps(user_context.get('injuries', []))}
- Mobility issues: {json.dumps(user_context.get('mobility_issues', []))}
- Workout focus: {workout_focus}
- Target duration: {duration_min} minutes

Modify the cooldown to:
1. Add extra stretching for injured/tight areas
2. Avoid painful positions
3. Maintain the target duration
4. Keep the same phase structure

Return the modified cooldown in the same JSON format."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert strength coach and physical therapist. Personalize cooldown routines to promote recovery and address mobility limitations.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            personalized = json.loads(response.choices[0].message.content)
            return personalized

        except Exception as e:
            print(f"Error personalizing cooldown: {e}")
            return base_template

    def _get_default_warmup(self, workout_focus: str, duration_min: int) -> Dict[str, Any]:
        """Get hardcoded default warmup"""
        return {
            "template_name": f"Default {workout_focus.replace('_', ' ').title()} Warmup",
            "total_duration_min": duration_min,
            "phases": [
                {
                    "phase_name": "General Activation",
                    "duration_min": 3,
                    "movements": [
                        {"name": "Light cardio", "duration_sec": 180, "notes": "Jog, bike, or row"}
                    ],
                },
                {
                    "phase_name": "Dynamic Stretching",
                    "duration_min": 5,
                    "movements": [
                        {"name": "Leg swings", "reps": 10, "sets": 2},
                        {"name": "Arm circles", "reps": 10, "sets": 2},
                        {"name": "Hip circles", "reps": 10, "sets": 2},
                    ],
                },
                {
                    "phase_name": "Movement Prep",
                    "duration_min": 2,
                    "movements": [
                        {"name": "Bodyweight squats", "reps": 10},
                        {"name": "Push-ups", "reps": 5},
                    ],
                },
            ],
        }

    def _get_default_cooldown(self, workout_focus: str, duration_min: int) -> Dict[str, Any]:
        """Get hardcoded default cooldown"""
        return {
            "template_name": f"Default {workout_focus.replace('_', ' ').title()} Cooldown",
            "total_duration_min": duration_min,
            "phases": [
                {
                    "phase_name": "Active Recovery",
                    "duration_min": 3,
                    "movements": [
                        {"name": "Light walk", "duration_sec": 180}
                    ],
                },
                {
                    "phase_name": "Static Stretching",
                    "duration_min": 7,
                    "movements": [
                        {"name": "Hamstring stretch", "duration_sec": 30, "sets": 2},
                        {"name": "Quad stretch", "duration_sec": 30, "sets": 2},
                        {"name": "Chest stretch", "duration_sec": 30, "sets": 2},
                    ],
                },
            ],
        }

