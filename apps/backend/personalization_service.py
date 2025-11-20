"""
Personalization Service

Manages user preferences and conversational preference updates.
Supports both structured preferences and natural language updates.
"""

import os
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class PersonalizationService:
    """Advanced personalization with conversational updates"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """
        Get user preferences, creating defaults if none exist

        Returns:
            User preferences dict
        """
        try:
            result = (
                self.supabase.table("user_preferences")
                .select("*")
                .eq("user_id", user_id)
                .single()
                .execute()
            )

            if result.data:
                return result.data

            # Create default preferences
            return self._create_default_preferences(user_id)

        except Exception as e:
            print(f"Error getting user preferences: {e}")
            return self._create_default_preferences(user_id)

    def _create_default_preferences(self, user_id: str) -> Dict[str, Any]:
        """Create default preferences for new user"""
        try:
            result = (
                self.supabase.table("user_preferences")
                .insert({"user_id": user_id})
                .execute()
            )
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"Error creating default preferences: {e}")
            return {}

    def update_preference(
        self,
        user_id: str,
        preference_key: str,
        new_value: Any,
        source: str = "ui",
        conversation_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Update a single preference

        Args:
            user_id: User ID
            preference_key: Preference field name
            new_value: New value
            source: Update source (chat|voice|ui|system)
            conversation_context: Optional conversation context

        Returns:
            Updated preferences
        """
        try:
            # Get current preferences
            current_prefs = self.get_user_preferences(user_id)
            old_value = current_prefs.get(preference_key)

            # Update preference
            result = (
                self.supabase.table("user_preferences")
                .update({preference_key: new_value, "updated_at": datetime.now().isoformat()})
                .eq("user_id", user_id)
                .execute()
            )

            # Log conversational update if from chat/voice
            if source in ["chat", "voice"]:
                self._log_conversational_update(
                    user_id, preference_key, old_value, new_value, source, conversation_context
                )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error updating preference: {e}")
            raise

    def extract_preferences_from_conversation(
        self, user_id: str, message: str, current_preferences: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Extract preference updates from natural language message

        Args:
            user_id: User ID
            message: User's message
            current_preferences: Current user preferences

        Returns:
            List of preference updates:
            [
                {
                    "preference_key": str,
                    "new_value": any,
                    "confidence": float,
                    "reasoning": str
                }
            ]
        """
        try:
            # Build prompt for preference extraction
            prompt = f"""Analyze this user message and extract any preference updates.

Current preferences:
{json.dumps(current_preferences, indent=2)}

User message: "{message}"

Identify any preferences the user wants to change. Common patterns:
- "I only have 30 minutes" → preferred_workout_duration_min: 30
- "I can't do overhead press" → disliked_exercises: add "overhead_press"
- "I prefer morning workouts" → preferred_workout_time: "morning"
- "I want to train 5 days a week" → max_workouts_per_week: 5

Return JSON:
{{
  "updates": [
    {{
      "preference_key": "field_name",
      "new_value": value,
      "confidence": 0.0-1.0,
      "reasoning": "why this update was inferred"
    }}
  ]
}}

If no preferences detected, return {{"updates": []}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at extracting user preferences from natural language. Be conservative - only extract clear, explicit preferences.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            updates = result.get("updates", [])

            # Apply high-confidence updates automatically
            for update in updates:
                if update["confidence"] >= 0.8:
                    self.update_preference(
                        user_id,
                        update["preference_key"],
                        update["new_value"],
                        source="chat",
                        conversation_context=message,
                    )

            return updates

        except Exception as e:
            print(f"Error extracting preferences: {e}")
            return []

    def _log_conversational_update(
        self,
        user_id: str,
        preference_key: str,
        old_value: Any,
        new_value: Any,
        source: str,
        conversation_context: Optional[str],
    ):
        """Log conversational preference update for audit trail"""
        try:
            self.supabase.table("conversational_preference_updates").insert({
                "user_id": user_id,
                "preference_key": preference_key,
                "old_value": old_value,
                "new_value": new_value,
                "update_source": source,
                "conversation_context": conversation_context,
                "confidence": 1.0,  # Explicit updates have full confidence
                "applied": True,
            }).execute()
        except Exception as e:
            print(f"Error logging conversational update: {e}")

