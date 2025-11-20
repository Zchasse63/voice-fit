"""
Voice Session Service

Manages stateful voice sessions for complex multi-turn flows:
- Workout logging (collect exercises, sets, reps, RPE)
- Program generation (gather requirements, confirm details)
- Q&A sessions (maintain context across questions)

Simple queries remain stateless.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class VoiceSessionService:
    """Stateful voice session management"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def create_session(
        self, user_id: str, session_type: str, initial_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a new voice session

        Args:
            user_id: User ID
            session_type: Type of session (workout_logging|program_generation|question|general)
            initial_context: Optional initial context data

        Returns:
            Session dict with id, type, status, etc.
        """
        try:
            result = (
                self.supabase.table("voice_sessions")
                .insert({
                    "user_id": user_id,
                    "session_type": session_type,
                    "status": "active",
                    "context_data": initial_context or {},
                    "messages": [],
                    "started_at": datetime.now().isoformat(),
                    "last_activity_at": datetime.now().isoformat(),
                    "expires_at": (datetime.now() + timedelta(minutes=30)).isoformat(),
                })
                .execute()
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error creating voice session: {e}")
            raise

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        try:
            result = (
                self.supabase.table("voice_sessions")
                .select("*")
                .eq("id", session_id)
                .single()
                .execute()
            )

            return result.data if result.data else None

        except Exception as e:
            print(f"Error getting voice session: {e}")
            return None

    def update_session(
        self,
        session_id: str,
        current_step: Optional[str] = None,
        context_data: Optional[Dict] = None,
        new_message: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Update session state

        Args:
            session_id: Session ID
            current_step: New current step
            context_data: Updated context data
            new_message: New message to append to history

        Returns:
            Updated session dict
        """
        try:
            # Get current session
            session = self.get_session(session_id)
            if not session:
                raise ValueError(f"Session {session_id} not found")

            # Build update payload
            update_data = {
                "last_activity_at": datetime.now().isoformat(),
                "expires_at": (datetime.now() + timedelta(minutes=30)).isoformat(),
            }

            if current_step:
                update_data["current_step"] = current_step

            if context_data:
                update_data["context_data"] = context_data

            if new_message:
                messages = session.get("messages", [])
                messages.append({
                    **new_message,
                    "timestamp": datetime.now().isoformat(),
                })
                update_data["messages"] = messages

            # Update session
            result = (
                self.supabase.table("voice_sessions")
                .update(update_data)
                .eq("id", session_id)
                .execute()
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error updating voice session: {e}")
            raise

    def complete_session(self, session_id: str) -> Dict[str, Any]:
        """Mark session as completed"""
        try:
            result = (
                self.supabase.table("voice_sessions")
                .update({
                    "status": "completed",
                    "completed_at": datetime.now().isoformat(),
                })
                .eq("id", session_id)
                .execute()
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error completing voice session: {e}")
            raise

    def get_active_session(
        self, user_id: str, session_type: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get user's active session of a specific type

        Args:
            user_id: User ID
            session_type: Optional session type filter

        Returns:
            Active session or None
        """
        try:
            query = (
                self.supabase.table("voice_sessions")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", "active")
                .gt("expires_at", datetime.now().isoformat())
                .order("last_activity_at", desc=True)
            )

            if session_type:
                query = query.eq("session_type", session_type)

            result = query.limit(1).execute()

            return result.data[0] if result.data else None

        except Exception as e:
            print(f"Error getting active session: {e}")
            return None

    def should_use_session(self, message: str, user_id: str) -> Dict[str, Any]:
        """
        Determine if message requires a session

        Args:
            message: User's message
            user_id: User ID

        Returns:
            {
                "requires_session": bool,
                "session_type": str,
                "reasoning": str,
                "existing_session_id": str (if applicable)
            }
        """
        try:
            # Check for existing active session
            existing_session = self.get_active_session(user_id)

            # AI classification
            prompt = f"""Determine if this user message requires a stateful session.

User message: "{message}"

Existing active session: {json.dumps(existing_session) if existing_session else "None"}

Session types:
- workout_logging: Multi-turn workout logging ("I did bench press", "3 sets of 8 reps", etc.)
- program_generation: Multi-turn program creation (gathering requirements, confirming details)
- question: Simple Q&A (stateless, no session needed)
- general: General conversation (stateless)

Return JSON:
{{
  "requires_session": true/false,
  "session_type": "workout_logging|program_generation|question|general",
  "reasoning": "why session is/isn't needed",
  "continue_existing": true/false (if existing session should continue)
}}

Guidelines:
- Simple questions don't need sessions
- Multi-step processes (logging workouts, creating programs) need sessions
- If existing session is relevant, continue it"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at determining when stateful sessions are needed for voice interactions.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)

            # Add existing session ID if continuing
            if result.get("continue_existing") and existing_session:
                result["existing_session_id"] = existing_session["id"]

            return result

        except Exception as e:
            print(f"Error determining session need: {e}")
            return {
                "requires_session": False,
                "session_type": "general",
                "reasoning": "Error in classification",
            }

    def check_expiration(self, session_id: str) -> Dict[str, Any]:
        """
        Check if session is expiring or expired

        Args:
            session_id: Session ID

        Returns:
            {
                "status": "active" | "expiring" | "expired",
                "time_remaining": seconds,
                "expires_at": ISO timestamp
            }
        """
        try:
            session = self.get_session(session_id)
            if not session:
                return {"status": "expired", "time_remaining": 0}

            now = datetime.now()
            expires_at = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))

            time_remaining = (expires_at - now).total_seconds()

            # 5 minute warning period
            WARNING_DURATION = 5 * 60

            if time_remaining <= 0:
                # Mark as expired
                self.expire_session(session_id)
                return {"status": "expired", "time_remaining": 0, "expires_at": session["expires_at"]}
            elif time_remaining <= WARNING_DURATION:
                # Update status to expiring
                self.supabase.table("voice_sessions").update({"status": "expiring"}).eq("id", session_id).execute()
                return {"status": "expiring", "time_remaining": time_remaining, "expires_at": session["expires_at"]}
            else:
                return {"status": "active", "time_remaining": time_remaining, "expires_at": session["expires_at"]}

        except Exception as e:
            print(f"Error checking session expiration: {e}")
            return {"status": "expired", "time_remaining": 0}

    def update_activity(self, session_id: str) -> Dict[str, Any]:
        """
        Update session activity and extend expiration

        Args:
            session_id: Session ID

        Returns:
            Updated session dict
        """
        try:
            now = datetime.now()
            expires_at = now + timedelta(minutes=30)

            result = (
                self.supabase.table("voice_sessions")
                .update({
                    "last_activity_at": now.isoformat(),
                    "expires_at": expires_at.isoformat(),
                    "status": "active",
                })
                .eq("id", session_id)
                .execute()
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error updating session activity: {e}")
            raise

    def expire_session(self, session_id: str) -> Dict[str, Any]:
        """
        Mark session as expired

        Args:
            session_id: Session ID

        Returns:
            Updated session dict
        """
        try:
            result = (
                self.supabase.table("voice_sessions")
                .update({"status": "expired"})
                .eq("id", session_id)
                .execute()
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            print(f"Error expiring session: {e}")
            raise

    def cleanup_expired_sessions(self) -> int:
        """
        Cleanup expired sessions (background job)

        Returns:
            Number of sessions cleaned up
        """
        try:
            now = datetime.now()

            # Find sessions that have expired
            result = (
                self.supabase.table("voice_sessions")
                .update({"status": "expired"})
                .lt("expires_at", now.isoformat())
                .in_("status", ["active", "expiring"])
                .execute()
            )

            count = len(result.data) if result.data else 0
            print(f"Cleaned up {count} expired sessions")
            return count

        except Exception as e:
            print(f"Error cleaning up expired sessions: {e}")
            return 0

