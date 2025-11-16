"""
Context-Aware Exercise Swap Service

Provides intelligent exercise substitutions using:
1. User context (equipment, program, injuries, session)
2. RAG fuzzy matching (Upstash Search for canonical names)
3. Database filtering (equipment, injury, difficulty)
4. AI re-ranking (Grok 4 Fast Reasoning for personalization)

Philosophy: Every recommendation leverages all available user data for personalization.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from upstash_search import Search

from supabase import Client

load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# API keys
XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_BASE_URL = "https://api.x.ai/v1"
UPSTASH_SEARCH_URL = os.getenv("UPSTASH_SEARCH_REST_URL")
UPSTASH_SEARCH_TOKEN = os.getenv("UPSTASH_SEARCH_REST_TOKEN")


class ExerciseSwapService:
    """
    Context-aware exercise swap service.

    Workflow:
    1. Gather user context (onboarding, program, injuries, session)
    2. Fuzzy match exercise name via RAG (handle typos, synonyms)
    3. Query database with context filters (equipment, injury)
    4. AI re-rank results (personalize based on full context)
    5. Return top 3 substitutes with reasoning
    """

    def __init__(self, supabase_client: Client):
        """Initialize the service with database client."""
        self.supabase = supabase_client

        # Initialize Upstash Search client (RAG)
        if UPSTASH_SEARCH_URL and UPSTASH_SEARCH_TOKEN:
            self.search_client = Search(
                url=UPSTASH_SEARCH_URL, token=UPSTASH_SEARCH_TOKEN
            )
        else:
            self.search_client = None
            logger.warning("Upstash Search not configured - fuzzy matching disabled")

    async def get_context_aware_substitutes(
        self,
        user_id: str,
        exercise_name: str,
        injured_body_part: Optional[str] = None,
        reason: Optional[str] = None,
        include_ai_ranking: bool = True,
    ) -> Dict[str, Any]:
        """
        Get context-aware exercise substitutes.

        Args:
            user_id: User ID
            exercise_name: Exercise to substitute (can have typos)
            injured_body_part: Optional body part to protect
            reason: Optional reason for swap (injury, equipment, etc.)
            include_ai_ranking: Whether to use AI re-ranking (premium feature)

        Returns:
            Dict with substitutes, context used, and message
        """
        try:
            # STEP 1: Gather all user context (parallel queries)
            logger.info(f"Gathering context for user {user_id}")
            context = await self.gather_user_context(user_id)

            # STEP 2: RAG fuzzy match to get canonical exercise name
            logger.info(f"Fuzzy matching exercise: {exercise_name}")
            canonical_name = await self.fuzzy_match_exercise(exercise_name)
            logger.info(f"Canonical name: {canonical_name}")

            # STEP 3: Query database with context filters
            logger.info(f"Querying substitutes with context filters")
            substitutes = await self.query_substitutes_with_context(
                canonical_name, context, injured_body_part
            )

            if not substitutes:
                return {
                    "success": True,
                    "original_exercise": canonical_name,
                    "substitutes": [],
                    "total_found": 0,
                    "context_used": self._summarize_context(context),
                    "message": self._build_no_results_message(canonical_name, context),
                }

            # STEP 4: AI re-ranking (if enabled and conditions met)
            ai_reranked = False
            if include_ai_ranking and (
                len(substitutes) > 5 or context.get("is_premium")
            ):
                logger.info(f"AI re-ranking {len(substitutes)} substitutes")
                substitutes = await self.ai_rerank_substitutes(
                    canonical_name, substitutes, context
                )
                ai_reranked = True

            # Return top 3
            top_substitutes = substitutes[:3]

            return {
                "success": True,
                "original_exercise": canonical_name,
                "substitutes": top_substitutes,
                "total_found": len(substitutes),
                "context_used": {
                    **self._summarize_context(context),
                    "ai_reranked": ai_reranked,
                },
                "message": self._build_success_message(
                    canonical_name, len(top_substitutes), context, injured_body_part
                ),
            }

        except Exception as e:
            logger.error(f"Error in get_context_aware_substitutes: {e}", exc_info=True)
            raise

    async def gather_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Gather all user context in parallel for fast retrieval.

        Queries:
        - Onboarding data (equipment, goals, experience)
        - Active program (phase, exercises)
        - Active injuries (body parts, severity)
        - Current session (fatigue, exercises completed)

        Returns:
            Combined context dictionary
        """
        # Launch all queries in parallel
        tasks = [
            self._fetch_onboarding_data(user_id),
            self._fetch_active_program(user_id),
            self._fetch_active_injuries(user_id),
            self._fetch_current_session(user_id),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        onboarding, program, injuries, session = results

        # Handle exceptions gracefully
        if isinstance(onboarding, Exception):
            logger.warning(f"Error fetching onboarding: {onboarding}")
            onboarding = {}
        if isinstance(program, Exception):
            logger.warning(f"Error fetching program: {program}")
            program = None
        if isinstance(injuries, Exception):
            logger.warning(f"Error fetching injuries: {injuries}")
            injuries = []
        if isinstance(session, Exception):
            logger.warning(f"Error fetching session: {session}")
            session = None

        # Combine into unified context
        return {
            "user_id": user_id,
            # Onboarding data
            "experience_level": onboarding.get("experience_level", "intermediate"),
            "training_goals": onboarding.get("training_goals", []),
            "available_equipment": onboarding.get(
                "available_equipment", ["bodyweight"]
            ),
            "training_frequency": onboarding.get("training_frequency", 3),
            "is_premium": onboarding.get("subscription_tier") == "premium",
            # Program context
            "has_active_program": program is not None,
            "program_phase": program.get("phase") if program else None,
            "current_week": program.get("current_week") if program else None,
            "program_exercises": program.get("exercises", []) if program else [],
            # Injury context
            "active_injuries": [
                inj for inj in injuries if inj.get("status") == "active"
            ],
            "injured_body_parts": [
                inj.get("body_part")
                for inj in injuries
                if inj.get("status") == "active"
            ],
            # Session context
            "in_active_session": session is not None,
            "session_fatigue": session.get("fatigue_level", "low")
            if session
            else "low",
            "exercises_completed_today": session.get("exercises_completed", [])
            if session
            else [],
        }

    async def _fetch_onboarding_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch user onboarding data (equipment, goals, experience)."""
        try:
            # Try user_profiles table first
            result = (
                self.supabase.table("user_profiles")
                .select("*")
                .eq("user_id", user_id)
                .single()
                .execute()
            )

            if result.data:
                return result.data

            # Fallback: try users table
            result = (
                self.supabase.table("users")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )

            return result.data if result.data else {}

        except Exception as e:
            logger.warning(f"Error fetching onboarding data: {e}")
            return {}

    async def _fetch_active_program(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch active training program."""
        try:
            result = (
                self.supabase.table("generated_programs")
                .select("*")
                .eq("user_id", user_id)
                .eq("status", "active")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as e:
            logger.warning(f"Error fetching program: {e}")
            return None

    async def _fetch_active_injuries(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch active injuries."""
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
            logger.warning(f"Error fetching injuries: {e}")
            return []

    async def _fetch_current_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch current workout session if active."""
        try:
            result = (
                self.supabase.table("workout_sessions")
                .select("*")
                .eq("user_id", user_id)
                .is_("end_time", "null")
                .order("start_time", desc=True)
                .limit(1)
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as e:
            logger.warning(f"Error fetching session: {e}")
            return None

    async def fuzzy_match_exercise(self, exercise_name: str) -> str:
        """
        Use Upstash RAG to fuzzy match exercise name to canonical name.

        Handles:
        - Typos: "bench pres" → "Bench Press"
        - Synonyms: "chest press" → "Bench Press"
        - Variations: "barbell bench press" → "Bench Press"

        Args:
            exercise_name: User's input (may have typos)

        Returns:
            Canonical exercise name from database
        """
        if not self.search_client:
            return exercise_name  # No RAG available, use original

        try:
            # Search in exercises namespace
            index = self.search_client.index("exercises")
            results = index.search(query=exercise_name, limit=1)

            if results and len(results) > 0:
                top_result = results[0]
                canonical_name = top_result.content.get("original_name", exercise_name)
                match_score = top_result.score if hasattr(top_result, "score") else 0.0

                # Only use canonical name if match score is high
                if match_score >= 0.70:
                    logger.info(
                        f"RAG match: '{exercise_name}' → '{canonical_name}' (score: {match_score:.2f})"
                    )
                    return canonical_name

            # Low confidence or no results - return original
            return exercise_name

        except Exception as e:
            logger.error(f"RAG fuzzy match error: {e}")
            return exercise_name  # Fallback to original

    async def query_substitutes_with_context(
        self,
        canonical_name: str,
        context: Dict[str, Any],
        injured_body_part: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Query exercise substitutions with context-based filtering.

        Filters:
        1. Equipment: Only show exercises user can do
        2. Injury: Prioritize exercises that reduce stress on injured areas
        3. Difficulty: Match user's experience level

        Args:
            canonical_name: Canonical exercise name (from RAG)
            context: User context dictionary
            injured_body_part: Optional injured body part to protect

        Returns:
            List of substitutes (filtered and enriched)
        """
        try:
            # Base query
            query = (
                self.supabase.table("exercise_substitutions")
                .select("*")
                .eq("exercise_name", canonical_name)
                .gte("similarity_score", 0.65)
            )

            # Filter by injured body part (if specified)
            if injured_body_part:
                # Prioritize substitutes that reduce stress OR have no specific stress area
                query = query.or_(
                    f"reduced_stress_area.eq.{injured_body_part},"
                    f"reduced_stress_area.eq.none"
                )

            result = query.order("similarity_score", desc=True).limit(15).execute()

            if not result.data:
                return []

            # Post-filter by equipment availability
            available_equipment = context.get("available_equipment", [])
            filtered_subs = []

            for sub in result.data:
                required_equipment = sub.get("equipment_required", "bodyweight")

                # Check if user has required equipment
                if self._has_equipment(required_equipment, available_equipment):
                    # Enrich with context flags
                    sub["equipment_available"] = True
                    sub["matches_experience"] = self._matches_experience(
                        sub.get("difficulty_level"), context.get("experience_level")
                    )
                    sub["reduces_injury_stress"] = (
                        injured_body_part
                        and sub.get("reduced_stress_area") == injured_body_part
                    )
                    sub["matches_program"] = self._matches_program_phase(
                        sub.get("substitute_name"), context.get("program_phase")
                    )

                    filtered_subs.append(sub)

            return filtered_subs

        except Exception as e:
            logger.error(f"Error querying substitutes: {e}")
            return []

    def _has_equipment(self, required: str, available: List[str]) -> bool:
        """Check if user has required equipment."""
        if required == "bodyweight" or required == "none":
            return True
        if "full_gym" in available or "full gym" in available:
            return True
        return required in available or required.replace("_", " ") in available

    def _matches_experience(self, difficulty: str, experience: str) -> bool:
        """Check if exercise difficulty matches user experience."""
        if not difficulty or not experience:
            return True

        if experience == "beginner":
            return difficulty in ["beginner", "intermediate"]
        elif experience == "intermediate":
            return difficulty in ["intermediate", "intermediate-advanced"]
        elif experience == "advanced":
            return True  # Advanced can do anything

        return True  # Default: allow

    def _matches_program_phase(self, exercise_name: str, phase: Optional[str]) -> bool:
        """Check if substitute aligns with program phase (simplified)."""
        # This is a placeholder - can be enhanced with more sophisticated logic
        return True

    async def ai_rerank_substitutes(
        self, original: str, substitutes: List[Dict[str, Any]], context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Use Grok 4 Fast Reasoning to re-rank substitutes based on full context.

        Ranking Factors (priority order):
        1. Equipment availability (must-have)
        2. Injury compatibility (high priority)
        3. Program phase alignment (important)
        4. Similarity score (baseline)
        5. Experience level (important)
        6. Training goals (moderate)

        Args:
            original: Original exercise name
            substitutes: List of candidate substitutes
            context: User context dictionary

        Returns:
            Re-ranked substitutes with AI reasoning
        """
        if not XAI_API_KEY:
            logger.warning("XAI_API_KEY not set - skipping AI re-ranking")
            return substitutes

        try:
            # Build context-rich prompt
            prompt = f"""You are a strength coach helping a user find the best exercise substitute.

ORIGINAL EXERCISE: {original}

USER CONTEXT:
- Experience Level: {context.get("experience_level", "intermediate")}
- Training Goals: {", ".join(context.get("training_goals", ["general fitness"]))}
- Available Equipment: {", ".join(context.get("available_equipment", ["bodyweight"]))}
- Active Injuries: {", ".join(context.get("injured_body_parts", ["none"]))}
- Program Phase: {context.get("program_phase", "not in program")}
- Current Week: {context.get("current_week", "N/A")}
- Session Fatigue: {context.get("session_fatigue", "low")}

CANDIDATE SUBSTITUTES (from database):
{json.dumps(substitutes, indent=2, default=str)}

TASK:
Rank these substitutes from BEST to WORST for this specific user. Consider:
1. EQUIPMENT AVAILABILITY (must-have) - exclude if user doesn't have equipment
2. INJURY COMPATIBILITY (high priority) - prioritize exercises that reduce stress on injured areas
3. PROGRAM PHASE ALIGNMENT (important) - match intensity/volume to current phase
4. SIMILARITY SCORE (baseline) - from database, higher is better
5. EXPERIENCE LEVEL (important) - appropriate difficulty for user's level
6. TRAINING GOALS (moderate) - align with strength vs hypertrophy goals

Return ONLY valid JSON (no markdown, no explanation) with this exact format:
{{
  "ranked_substitutes": [
    {{
      ...all original substitute fields...,
      "ai_rank": 1,
      "rank_reasoning": "Brief explanation why this is best choice (max 100 chars)"
    }}
  ]
}}
"""

            # Call Grok 4 Fast Reasoning
            response = requests.post(
                f"{XAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {XAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "grok-4-fast-reasoning",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000,
                    "response_format": {"type": "json_object"},
                },
                timeout=10,
            )

            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]

            # Parse JSON response
            ranked_data = json.loads(content)
            ranked_subs = ranked_data.get("ranked_substitutes", [])

            if ranked_subs:
                logger.info(f"AI re-ranked {len(ranked_subs)} substitutes successfully")
                return ranked_subs
            else:
                logger.warning("AI re-ranking returned empty list")
                return substitutes

        except requests.Timeout:
            logger.error("AI re-ranking timeout - returning original order")
            return substitutes
        except Exception as e:
            logger.error(f"AI re-ranking error: {e}")
            return substitutes  # Fallback to original order

    def _summarize_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Summarize context for API response."""
        return {
            "equipment_filtered": context.get("available_equipment", []),
            "injury_aware": len(context.get("injured_body_parts", [])) > 0,
            "program_phase": context.get("program_phase"),
            "experience_level": context.get("experience_level"),
        }

    def _build_success_message(
        self,
        exercise_name: str,
        count: int,
        context: Dict[str, Any],
        injured_body_part: Optional[str],
    ) -> str:
        """Build contextual success message."""
        if injured_body_part:
            return f"Here are {count} alternatives that reduce stress on your {injured_body_part}:"
        elif context.get("injured_body_parts"):
            body_parts = ", ".join(context["injured_body_parts"])
            return f"Here are {count} alternatives that work around your {body_parts} injury:"
        else:
            return f"Here are {count} similar exercises you can do with your equipment:"

    def _build_no_results_message(
        self, exercise_name: str, context: Dict[str, Any]
    ) -> str:
        """Build message when no substitutes found."""
        equipment = context.get("available_equipment", [])
        if len(equipment) == 1 and equipment[0] == "bodyweight":
            return f"No substitutes found for {exercise_name} with bodyweight only. Consider adding equipment to your profile."
        else:
            return f"No substitutes found for {exercise_name} with your current equipment and constraints."


# Singleton instance
_service_instance: Optional[ExerciseSwapService] = None


def get_exercise_swap_service(supabase_client: Client) -> ExerciseSwapService:
    """Get or create singleton exercise swap service."""
    global _service_instance
    if _service_instance is None:
        _service_instance = ExerciseSwapService(supabase_client)
    return _service_instance
