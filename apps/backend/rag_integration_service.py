"""
RAG Integration Service

Provides consistent RAG (Retrieval-Augmented Generation) across all endpoints
using SmartNamespaceSelector with endpoint-specific questionnaire transformers.

This service:
- Transforms endpoint data into questionnaire format
- Selects optimal namespaces based on context
- Retrieves relevant knowledge chunks
- Caches results for performance
- Provides unified interface for all endpoints
"""

import hashlib
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from redis_client import get_cache_manager, get_redis_client

from smart_namespace_selector import SmartNamespaceSelector


class RAGIntegrationService:
    """
    Service for integrating RAG across endpoints with caching and optimization.
    """

    def __init__(self):
        self.selector = SmartNamespaceSelector()
        self.cache_manager = None

        # Initialize cache if available
        try:
            self.cache_manager = get_cache_manager()
        except Exception as e:
            print(f"⚠️  Cache manager unavailable: {e}")

    # =============================================================================
    # ENDPOINT-SPECIFIC QUESTIONNAIRE TRANSFORMERS
    # =============================================================================

    def transform_program_generation(
        self, request_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform program generation request into questionnaire format.

        Handles: /api/program/generate/strength, /api/program/generate/running
        """
        return {
            "primary_goal": request_data.get("primary_goal", ""),
            "secondary_goals": request_data.get("secondary_goals", []),
            "experience_level": request_data.get("experience_level", "beginner"),
            "training_split": request_data.get("training_split", "full_body"),
            "sessions_per_week": request_data.get("sessions_per_week", 3),
            "session_duration": request_data.get("session_duration", 60),
            "available_equipment": request_data.get("available_equipment", []),
            "injuries": request_data.get("injuries", []),
            "weak_points": request_data.get("weak_points", []),
            "preferences": request_data.get("preferences", {}),
            "program_type": request_data.get("program_type", "strength"),
        }

    def transform_workout_insights(
        self, workout_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform workout insights request into questionnaire format.

        Handles: /api/workout/insights
        """
        # Determine primary goal from exercises
        exercises = workout_data.get("exercises", [])
        primary_goal = self._infer_goal_from_exercises(exercises)

        return {
            "primary_goal": primary_goal,
            "experience_level": "intermediate",  # Can be enriched from user context
            "current_session": workout_data,
            "virtual_goal": "workout_analysis",
            "context_hints": ["performance", "recovery", "programming"],
        }

    def transform_coach_question(
        self, question: str, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform coach question into questionnaire format.

        Handles: /api/coach/ask
        """
        # Analyze question to determine focus areas
        question_lower = question.lower()

        primary_goal = "general"
        context_hints = []

        if any(
            word in question_lower for word in ["strength", "powerlifting", "strong"]
        ):
            primary_goal = "strength"
            context_hints.extend(["strength-training", "powerlifting"])
        elif any(
            word in question_lower
            for word in ["hypertrophy", "muscle", "size", "bodybuilding"]
        ):
            primary_goal = "hypertrophy"
            context_hints.extend(["hypertrophy", "volume-management"])
        elif any(
            word in question_lower for word in ["run", "running", "cardio", "endurance"]
        ):
            primary_goal = "running"
            context_hints.extend(["cardio-conditioning", "endurance"])
        elif any(word in question_lower for word in ["injury", "pain", "hurt"]):
            context_hints.extend(["injury-management", "injury-prevention"])
        elif any(
            word in question_lower
            for word in ["nutrition", "diet", "protein", "supplement"]
        ):
            context_hints.extend(["nutrition-and-supplementation"])
        elif any(word in question_lower for word in ["program", "plan", "routine"]):
            context_hints.extend(["programming", "program-structure"])
        elif any(
            word in question_lower for word in ["recover", "rest", "sleep", "fatigue"]
        ):
            context_hints.extend(["recovery-and-performance", "fatigue-management"])

        return {
            "primary_goal": primary_goal,
            "experience_level": user_context.get("experience_level", "intermediate"),
            "question": question,
            "context_hints": context_hints,
            "injuries": user_context.get("injuries", []),
            "available_equipment": user_context.get("equipment", []),
        }

    def transform_running_analysis(self, run_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform running analysis request into questionnaire format.

        Handles: /api/running/analyze
        """
        return {
            "primary_goal": "running",
            "experience_level": "intermediate",
            "run_type": run_data.get("run_type", "easy"),
            "virtual_goal": "running_analysis",
            "context_hints": ["cardio-conditioning", "endurance", "recovery"],
        }

    def transform_injury_analysis(self, injury_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform injury analysis request into questionnaire format.

        Handles: /api/injury/analyze
        """
        return {
            "primary_goal": "injury_prevention",
            "injuries": [injury_data.get("injury_description", "")],
            "experience_level": "intermediate",
            "virtual_goal": "injury_analysis",
            "context_hints": ["injury-management", "injury-prevention", "recovery"],
        }

    def transform_fatigue_analysis(
        self, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform fatigue analysis request into questionnaire format.

        Handles: /api/analytics/fatigue
        """
        return {
            "primary_goal": user_context.get("primary_goal", "general"),
            "experience_level": user_context.get("experience_level", "intermediate"),
            "virtual_goal": "fatigue_analysis",
            "context_hints": [
                "fatigue-management",
                "recovery-and-performance",
                "autoregulation",
            ],
        }

    def transform_deload_recommendation(
        self, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform deload recommendation request into questionnaire format.

        Handles: /api/analytics/deload
        """
        return {
            "primary_goal": user_context.get("primary_goal", "general"),
            "experience_level": user_context.get("experience_level", "intermediate"),
            "virtual_goal": "deload",
            "context_hints": [
                "fatigue-management",
                "recovery-and-performance",
                "periodization",
            ],
        }

    def transform_chat_classification(self, message: str) -> Dict[str, Any]:
        """
        Transform chat classification request into questionnaire format.

        Handles: /api/chat/classify
        """
        return {
            "primary_goal": "general",
            "message": message,
            "virtual_goal": "chat_classification",
            "context_hints": ["general"],
        }

    def transform_onboarding(self, conversation: str) -> Dict[str, Any]:
        """
        Transform onboarding request into questionnaire format.

        Handles: /api/onboarding/extract, /api/onboarding/conversational
        """
        return {
            "primary_goal": "general",
            "virtual_goal": "onboarding",
            "conversation": conversation,
            "context_hints": ["beginner-fundamentals", "fitness-assessment"],
        }

    def transform_exercise_swap(
        self, exercise_name: str, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform exercise swap request into questionnaire format.

        Handles: /api/chat/swap-exercise, /api/chat/swap-exercise-enhanced
        """
        return {
            "primary_goal": user_context.get("primary_goal", "general"),
            "experience_level": user_context.get("experience_level", "intermediate"),
            "target_exercise": exercise_name,
            "injuries": user_context.get("injuries", []),
            "available_equipment": user_context.get("equipment", []),
            "context_hints": ["exercise-selection", "equipment-substitution"],
        }

    def transform_adherence_report(
        self, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform adherence report request into questionnaire format.

        Handles: /api/adherence/report
        """
        return {
            "primary_goal": user_context.get("primary_goal", "general"),
            "experience_level": user_context.get("experience_level", "intermediate"),
            "virtual_goal": "adherence_tracking",
            "context_hints": ["adherence", "programming-logic"],
        }

    # =============================================================================
    # UNIFIED RAG RETRIEVAL
    # =============================================================================

    def get_rag_context(
        self,
        endpoint: str,
        request_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None,
        max_chunks: int = 50,
        use_cache: bool = True,
        cache_ttl: int = 3600,
    ) -> str:
        """
        Get RAG context for any endpoint.

        Args:
            endpoint: API endpoint path (e.g., '/api/program/generate/strength')
            request_data: Request-specific data
            user_context: Optional user context for enrichment
            max_chunks: Maximum number of chunks to retrieve
            use_cache: Whether to use cache
            cache_ttl: Cache TTL in seconds (default 1 hour)

        Returns:
            Formatted RAG context string
        """
        user_context = user_context or {}

        # Transform to questionnaire based on endpoint
        questionnaire = self._transform_by_endpoint(
            endpoint, request_data, user_context
        )

        # Check cache if enabled
        if use_cache and self.cache_manager:
            cache_key = self._generate_cache_key(endpoint, questionnaire)
            cached = self.cache_manager.get(cache_key)
            if cached:
                print(f"✅ RAG cache hit for {endpoint}")
                return cached

        # Retrieve knowledge
        context = self.selector.get_rag_context(questionnaire, max_chunks=max_chunks)

        # Cache result
        if use_cache and self.cache_manager and context:
            cache_key = self._generate_cache_key(endpoint, questionnaire)
            self.cache_manager.set(cache_key, context, ttl=cache_ttl)
            print(f"✅ Cached RAG context for {endpoint}")

        return context

    def get_rag_chunks(
        self,
        endpoint: str,
        request_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None,
        max_chunks: int = 50,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Get RAG chunks (structured) for any endpoint.

        Returns list of chunks with metadata instead of formatted string.
        """
        user_context = user_context or {}

        # Transform to questionnaire
        questionnaire = self._transform_by_endpoint(
            endpoint, request_data, user_context
        )

        # Build search query
        query_parts = []
        if questionnaire.get("primary_goal"):
            query_parts.append(questionnaire["primary_goal"])
        if questionnaire.get("experience_level"):
            query_parts.append(questionnaire["experience_level"])
        if questionnaire.get("virtual_goal"):
            query_parts.append(questionnaire["virtual_goal"])

        query = " ".join(query_parts)

        # Select namespaces
        namespace_config = self.selector.select_namespaces(questionnaire)

        # Retrieve knowledge
        chunks = self.selector.retrieve_knowledge(query, namespace_config)

        return chunks[:max_chunks]

    # =============================================================================
    # HELPER METHODS
    # =============================================================================

    def _transform_by_endpoint(
        self,
        endpoint: str,
        request_data: Dict[str, Any],
        user_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Route to appropriate transformer based on endpoint"""

        if "/program/generate" in endpoint:
            return self.transform_program_generation(request_data)
        elif "/workout/insights" in endpoint:
            return self.transform_workout_insights(request_data)
        elif "/coach/ask" in endpoint:
            question = request_data.get("question", "")
            return self.transform_coach_question(question, user_context)
        elif "/running/analyze" in endpoint:
            return self.transform_running_analysis(request_data)
        elif "/injury/analyze" in endpoint:
            return self.transform_injury_analysis(request_data)
        elif "/analytics/fatigue" in endpoint:
            return self.transform_fatigue_analysis(user_context)
        elif "/analytics/deload" in endpoint:
            return self.transform_deload_recommendation(user_context)
        elif "/chat/classify" in endpoint:
            message = request_data.get("message", "")
            return self.transform_chat_classification(message)
        elif "/onboarding" in endpoint:
            conversation = request_data.get("conversation", "")
            return self.transform_onboarding(conversation)
        elif "/swap-exercise" in endpoint:
            exercise = request_data.get("exercise_name", "")
            return self.transform_exercise_swap(exercise, user_context)
        elif "/adherence/report" in endpoint:
            return self.transform_adherence_report(user_context)
        else:
            # Default fallback
            return {
                "primary_goal": "general",
                "experience_level": "intermediate",
                "context_hints": ["general"],
            }

    def _generate_cache_key(self, endpoint: str, questionnaire: Dict[str, Any]) -> str:
        """Generate cache key from endpoint and questionnaire"""
        # Create deterministic hash of questionnaire
        questionnaire_json = json.dumps(questionnaire, sort_keys=True)
        questionnaire_hash = hashlib.md5(questionnaire_json.encode()).hexdigest()[:12]

        # Clean endpoint for key
        endpoint_clean = endpoint.replace("/", "_").replace("-", "_")

        return f"rag:context:{endpoint_clean}:{questionnaire_hash}"

    def _infer_goal_from_exercises(self, exercises: List[Dict[str, Any]]) -> str:
        """Infer training goal from exercise list"""
        exercise_names = " ".join([ex.get("name", "").lower() for ex in exercises])

        # Check for powerlifting exercises
        if any(word in exercise_names for word in ["squat", "bench", "deadlift"]):
            return "strength"

        # Check for bodybuilding exercises
        if any(word in exercise_names for word in ["curl", "fly", "lateral", "cable"]):
            return "hypertrophy"

        # Check for running/cardio
        if any(word in exercise_names for word in ["run", "jog", "sprint"]):
            return "running"

        return "general"


# =============================================================================
# DEPENDENCY INJECTION
# =============================================================================

_rag_service = None


def get_rag_service() -> RAGIntegrationService:
    """Dependency injection for RAG service"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGIntegrationService()
    return _rag_service


# =============================================================================
# USAGE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    # Example 1: Program generation
    service = RAGIntegrationService()

    request_data = {
        "primary_goal": "strength",
        "experience_level": "intermediate",
        "training_split": "upper_lower",
        "sessions_per_week": 4,
        "injuries": ["lower back"],
    }

    context = service.get_rag_context(
        endpoint="/api/program/generate/strength",
        request_data=request_data,
        max_chunks=40,
    )

    print(f"Program generation context: {len(context)} chars")

    # Example 2: Coach question
    user_context = {
        "experience_level": "intermediate",
        "injuries": ["shoulder"],
        "equipment": ["barbell", "dumbbells"],
    }

    request_data = {
        "question": "How can I increase my bench press?",
    }

    context = service.get_rag_context(
        endpoint="/api/coach/ask",
        request_data=request_data,
        user_context=user_context,
        max_chunks=30,
    )

    print(f"Coach Q&A context: {len(context)} chars")
