"""
Integration Tests for Context-Aware Exercise Swap

Tests the full flow from user request to personalized substitutes:
1. Context gathering (onboarding, program, injuries, session)
2. RAG fuzzy matching (canonical name resolution)
3. Database filtering (equipment, injury, difficulty)
4. AI re-ranking (Grok 4 Fast Reasoning)
5. Feature flags (gradual rollout, premium gating)

Run with: pytest test_exercise_swap_integration.py -v
"""

import asyncio
import json
import os
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from dotenv import load_dotenv
from exercise_swap_service import ExerciseSwapService
from feature_flags import FeatureFlags

load_dotenv()


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
def mock_supabase():
    """Mock Supabase client with chainable query methods."""
    mock = MagicMock()

    # Mock table() returns self for chaining
    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.eq.return_value = mock
    mock.in_.return_value = mock
    mock.is_.return_value = mock
    mock.gte.return_value = mock
    mock.order.return_value = mock
    mock.limit.return_value = mock
    mock.single.return_value = mock

    return mock


@pytest.fixture
def mock_user_context():
    """Mock user context data."""
    return {
        "user_id": "test-user-123",
        "experience_level": "intermediate",
        "training_goals": ["strength", "hypertrophy"],
        "available_equipment": ["barbell", "dumbbells", "bench"],
        "training_frequency": 4,
        "is_premium": True,
        "has_active_program": True,
        "program_phase": "accumulation",
        "current_week": 4,
        "program_exercises": ["Bench Press", "Squat", "Deadlift"],
        "active_injuries": [
            {"body_part": "shoulder", "severity": "moderate", "status": "active"}
        ],
        "injured_body_parts": ["shoulder"],
        "in_active_session": True,
        "session_fatigue": "moderate",
        "exercises_completed_today": ["Squat"],
    }


@pytest.fixture
def mock_substitutes():
    """Mock exercise substitutes from database."""
    return [
        {
            "id": "1",
            "exercise_name": "Bench Press",
            "substitute_name": "Floor Press",
            "similarity_score": 0.88,
            "reduced_stress_area": "shoulder",
            "movement_pattern": "horizontal_push",
            "primary_muscles": "pectoralis_major,anterior_deltoid,triceps_brachii",
            "equipment_required": "barbell",
            "difficulty_level": "intermediate",
            "notes": "Reduced ROM protects shoulder",
        },
        {
            "id": "2",
            "exercise_name": "Bench Press",
            "substitute_name": "Dumbbell Bench Press",
            "similarity_score": 0.92,
            "reduced_stress_area": "shoulder",
            "movement_pattern": "horizontal_push",
            "primary_muscles": "pectoralis_major,anterior_deltoid,triceps_brachii",
            "equipment_required": "dumbbells",
            "difficulty_level": "intermediate",
            "notes": "More natural movement path",
        },
        {
            "id": "3",
            "exercise_name": "Bench Press",
            "substitute_name": "Incline Dumbbell Press",
            "similarity_score": 0.85,
            "reduced_stress_area": "shoulder",
            "movement_pattern": "incline_push",
            "primary_muscles": "pectoralis_major,anterior_deltoid",
            "equipment_required": "dumbbells",
            "difficulty_level": "intermediate",
            "notes": "Upper chest emphasis",
        },
        {
            "id": "4",
            "exercise_name": "Bench Press",
            "substitute_name": "Machine Chest Press",
            "similarity_score": 0.75,
            "reduced_stress_area": "none",
            "movement_pattern": "horizontal_push",
            "primary_muscles": "pectoralis_major",
            "equipment_required": "machines",
            "difficulty_level": "beginner",
            "notes": "Fixed path, very stable",
        },
    ]


# ============================================================================
# CONTEXT GATHERING TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_gather_user_context_success(mock_supabase):
    """Test successful context gathering with all data available."""
    service = ExerciseSwapService(mock_supabase)

    # Mock successful responses for all queries
    mock_supabase.execute.return_value.data = {
        "experience_level": "intermediate",
        "training_goals": ["strength"],
        "available_equipment": ["barbell", "dumbbells"],
        "subscription_tier": "premium",
    }

    context = await service.gather_user_context("test-user-123")

    assert context["user_id"] == "test-user-123"
    assert context["experience_level"] == "intermediate"
    assert "barbell" in context["available_equipment"]
    assert context["is_premium"] is True


@pytest.mark.asyncio
async def test_gather_user_context_partial_failure(mock_supabase):
    """Test context gathering with some queries failing (graceful degradation)."""
    service = ExerciseSwapService(mock_supabase)

    # Mock program query failing, others succeeding
    async def mock_fetch_program(user_id):
        raise Exception("Database timeout")

    service._fetch_active_program = mock_fetch_program

    context = await service.gather_user_context("test-user-123")

    # Should still return context with defaults
    assert context["user_id"] == "test-user-123"
    assert context["has_active_program"] is False
    assert context["program_phase"] is None


@pytest.mark.asyncio
async def test_gather_user_context_new_user(mock_supabase):
    """Test context gathering for brand new user (no data yet)."""
    service = ExerciseSwapService(mock_supabase)

    # Mock empty responses
    mock_supabase.execute.return_value.data = None

    context = await service.gather_user_context("new-user-456")

    # Should return safe defaults
    assert context["user_id"] == "new-user-456"
    assert context["experience_level"] == "intermediate"
    assert context["available_equipment"] == ["bodyweight"]
    assert context["is_premium"] is False


# ============================================================================
# RAG FUZZY MATCHING TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_fuzzy_match_exact_name(mock_supabase):
    """Test RAG fuzzy match with exact exercise name."""
    service = ExerciseSwapService(mock_supabase)

    # Mock RAG search returning high confidence match
    mock_search_client = Mock()
    mock_index = Mock()
    mock_result = Mock()
    mock_result.content = {"original_name": "Bench Press"}
    mock_result.score = 0.98

    mock_index.search.return_value = [mock_result]
    mock_search_client.index.return_value = mock_index
    service.search_client = mock_search_client

    canonical = await service.fuzzy_match_exercise("Bench Press")

    assert canonical == "Bench Press"


@pytest.mark.asyncio
async def test_fuzzy_match_with_typo(mock_supabase):
    """Test RAG fuzzy match corrects typo."""
    service = ExerciseSwapService(mock_supabase)

    # Mock RAG finding correct exercise despite typo
    mock_search_client = Mock()
    mock_index = Mock()
    mock_result = Mock()
    mock_result.content = {"original_name": "Bench Press"}
    mock_result.score = 0.85

    mock_index.search.return_value = [mock_result]
    mock_search_client.index.return_value = mock_index
    service.search_client = mock_search_client

    canonical = await service.fuzzy_match_exercise("bench pres")

    assert canonical == "Bench Press"


@pytest.mark.asyncio
async def test_fuzzy_match_low_confidence(mock_supabase):
    """Test RAG fuzzy match with low confidence returns original."""
    service = ExerciseSwapService(mock_supabase)

    # Mock RAG returning low confidence
    mock_search_client = Mock()
    mock_index = Mock()
    mock_result = Mock()
    mock_result.content = {"original_name": "Something Else"}
    mock_result.score = 0.45  # Below 0.70 threshold

    mock_index.search.return_value = [mock_result]
    mock_search_client.index.return_value = mock_index
    service.search_client = mock_search_client

    canonical = await service.fuzzy_match_exercise("weird exercise")

    assert canonical == "weird exercise"  # Returns original


@pytest.mark.asyncio
async def test_fuzzy_match_no_rag_available(mock_supabase):
    """Test fuzzy match when RAG service is unavailable."""
    service = ExerciseSwapService(mock_supabase)
    service.search_client = None  # No RAG

    canonical = await service.fuzzy_match_exercise("Bench Press")

    assert canonical == "Bench Press"  # Returns original


# ============================================================================
# EQUIPMENT FILTERING TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_equipment_filtering_matches(
    mock_supabase, mock_user_context, mock_substitutes
):
    """Test equipment filtering only shows exercises user can do."""
    service = ExerciseSwapService(mock_supabase)

    # Mock database query
    mock_supabase.execute.return_value.data = mock_substitutes

    # User has barbell and dumbbells, not machines
    mock_user_context["available_equipment"] = ["barbell", "dumbbells"]

    filtered = await service.query_substitutes_with_context(
        "Bench Press", mock_user_context, None
    )

    # Should exclude Machine Chest Press (requires machines)
    assert len(filtered) == 3
    assert all(
        sub["equipment_required"] in ["barbell", "dumbbells"] for sub in filtered
    )


@pytest.mark.asyncio
async def test_equipment_filtering_full_gym(
    mock_supabase, mock_user_context, mock_substitutes
):
    """Test user with full gym access sees all exercises."""
    service = ExerciseSwapService(mock_supabase)

    mock_supabase.execute.return_value.data = mock_substitutes
    mock_user_context["available_equipment"] = ["full_gym"]

    filtered = await service.query_substitutes_with_context(
        "Bench Press", mock_user_context, None
    )

    # Should include all substitutes
    assert len(filtered) == 4


@pytest.mark.asyncio
async def test_equipment_filtering_bodyweight_only(mock_supabase, mock_user_context):
    """Test user with only bodyweight sees limited options."""
    service = ExerciseSwapService(mock_supabase)

    # Mock substitutes with some bodyweight options
    bodyweight_subs = [
        {
            "id": "5",
            "exercise_name": "Bench Press",
            "substitute_name": "Push-ups",
            "similarity_score": 0.72,
            "equipment_required": "bodyweight",
            "difficulty_level": "beginner",
        }
    ]

    mock_supabase.execute.return_value.data = bodyweight_subs
    mock_user_context["available_equipment"] = ["bodyweight"]

    filtered = await service.query_substitutes_with_context(
        "Bench Press", mock_user_context, None
    )

    assert len(filtered) == 1
    assert filtered[0]["substitute_name"] == "Push-ups"


# ============================================================================
# INJURY FILTERING TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_injury_filtering_prioritizes_shoulder_friendly(
    mock_supabase, mock_user_context, mock_substitutes
):
    """Test injury filtering prioritizes exercises that reduce shoulder stress."""
    service = ExerciseSwapService(mock_supabase)

    mock_supabase.execute.return_value.data = mock_substitutes

    filtered = await service.query_substitutes_with_context(
        "Bench Press", mock_user_context, injured_body_part="shoulder"
    )

    # All returned exercises should either reduce shoulder stress or have no specific area
    for sub in filtered:
        assert sub["reduces_injury_stress"] or sub["reduced_stress_area"] == "none"


# ============================================================================
# AI RE-RANKING TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_ai_reranking_success(mock_supabase, mock_user_context, mock_substitutes):
    """Test AI re-ranking with successful Grok API call."""
    service = ExerciseSwapService(mock_supabase)

    # Mock Grok API response
    mock_response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "ranked_substitutes": [
                                {
                                    **mock_substitutes[0],
                                    "ai_rank": 1,
                                    "rank_reasoning": "Best: has equipment, reduces shoulder stress",
                                },
                                {
                                    **mock_substitutes[1],
                                    "ai_rank": 2,
                                    "rank_reasoning": "Good: dumbbells available, shoulder-friendly",
                                },
                            ]
                        }
                    )
                }
            }
        ]
    }

    with patch("requests.post") as mock_post:
        mock_post.return_value.json.return_value = mock_response
        mock_post.return_value.raise_for_status = Mock()

        ranked = await service.ai_rerank_substitutes(
            "Bench Press", mock_substitutes, mock_user_context
        )

        assert len(ranked) == 2
        assert ranked[0]["ai_rank"] == 1
        assert "rank_reasoning" in ranked[0]


@pytest.mark.asyncio
async def test_ai_reranking_api_failure(
    mock_supabase, mock_user_context, mock_substitutes
):
    """Test AI re-ranking falls back gracefully when API fails."""
    service = ExerciseSwapService(mock_supabase)

    with patch("requests.post") as mock_post:
        mock_post.side_effect = Exception("API timeout")

        ranked = await service.ai_rerank_substitutes(
            "Bench Press", mock_substitutes, mock_user_context
        )

        # Should return original order
        assert ranked == mock_substitutes


@pytest.mark.asyncio
async def test_ai_reranking_no_api_key(
    mock_supabase, mock_user_context, mock_substitutes
):
    """Test AI re-ranking skips when API key not configured."""
    service = ExerciseSwapService(mock_supabase)

    with patch.dict(os.environ, {"XAI_API_KEY": ""}):
        ranked = await service.ai_rerank_substitutes(
            "Bench Press", mock_substitutes, mock_user_context
        )

        # Should return original order
        assert ranked == mock_substitutes


# ============================================================================
# FULL FLOW INTEGRATION TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_full_flow_success(mock_supabase, mock_user_context, mock_substitutes):
    """Test complete flow from request to personalized substitutes."""
    service = ExerciseSwapService(mock_supabase)

    # Mock all dependencies
    service.gather_user_context = AsyncMock(return_value=mock_user_context)
    service.fuzzy_match_exercise = AsyncMock(return_value="Bench Press")
    service.query_substitutes_with_context = AsyncMock(
        return_value=mock_substitutes[:3]
    )
    service.ai_rerank_substitutes = AsyncMock(return_value=mock_substitutes[:3])

    result = await service.get_context_aware_substitutes(
        user_id="test-user-123",
        exercise_name="bench press",
        injured_body_part="shoulder",
        include_ai_ranking=True,
    )

    assert result["success"] is True
    assert result["original_exercise"] == "Bench Press"
    assert len(result["substitutes"]) == 3
    assert result["context_used"]["injury_aware"] is True
    assert result["context_used"]["ai_reranked"] is True


@pytest.mark.asyncio
async def test_full_flow_no_results(mock_supabase, mock_user_context):
    """Test full flow when no substitutes found."""
    service = ExerciseSwapService(mock_supabase)

    service.gather_user_context = AsyncMock(return_value=mock_user_context)
    service.fuzzy_match_exercise = AsyncMock(return_value="Exotic Exercise")
    service.query_substitutes_with_context = AsyncMock(return_value=[])

    result = await service.get_context_aware_substitutes(
        user_id="test-user-123",
        exercise_name="exotic exercise",
    )

    assert result["success"] is True
    assert len(result["substitutes"]) == 0
    assert "No substitutes found" in result["message"]


# ============================================================================
# FEATURE FLAG TESTS
# ============================================================================


def test_feature_flag_enabled_globally():
    """Test feature flag enabled globally."""
    flags = FeatureFlags(supabase_client=None)
    flags.DEFAULT_FLAGS["test_feature"] = {
        "enabled": True,
        "rollout_percentage": 100,
        "premium_only": False,
    }

    assert flags.is_enabled("test_feature", "any-user-id") is True


def test_feature_flag_disabled_globally():
    """Test feature flag disabled globally."""
    flags = FeatureFlags(supabase_client=None)
    flags.DEFAULT_FLAGS["test_feature"] = {
        "enabled": False,
        "rollout_percentage": 100,
        "premium_only": False,
    }

    assert flags.is_enabled("test_feature", "any-user-id") is False


def test_feature_flag_premium_only_free_user():
    """Test premium-only feature blocked for free user."""
    flags = FeatureFlags(supabase_client=None)
    flags.DEFAULT_FLAGS["premium_feature"] = {
        "enabled": True,
        "rollout_percentage": 100,
        "premium_only": True,
    }

    user_context = {"subscription_tier": "free"}

    assert flags.is_enabled("premium_feature", "user-123", user_context) is False


def test_feature_flag_premium_only_premium_user():
    """Test premium-only feature allowed for premium user."""
    flags = FeatureFlags(supabase_client=None)
    flags.DEFAULT_FLAGS["premium_feature"] = {
        "enabled": True,
        "rollout_percentage": 100,
        "premium_only": True,
    }

    user_context = {"subscription_tier": "premium"}

    assert flags.is_enabled("premium_feature", "user-123", user_context) is True


def test_feature_flag_rollout_percentage():
    """Test percentage-based rollout using consistent hashing."""
    flags = FeatureFlags(supabase_client=None)
    flags.DEFAULT_FLAGS["rollout_feature"] = {
        "enabled": True,
        "rollout_percentage": 50,  # 50% rollout
        "premium_only": False,
    }

    # Test with multiple users - should be roughly 50% enabled
    results = []
    for i in range(100):
        user_id = f"user-{i}"
        results.append(flags.is_enabled("rollout_feature", user_id))

    # Should be approximately 50% (allow 40-60% range for randomness)
    enabled_count = sum(results)
    assert 40 <= enabled_count <= 60


def test_feature_flag_consistent_hashing():
    """Test that same user always gets same result (consistency)."""
    flags = FeatureFlags(supabase_client=None)
    flags.DEFAULT_FLAGS["rollout_feature"] = {
        "enabled": True,
        "rollout_percentage": 50,
        "premium_only": False,
    }

    user_id = "consistent-user-123"

    # Call multiple times - should always return same result
    result1 = flags.is_enabled("rollout_feature", user_id)
    result2 = flags.is_enabled("rollout_feature", user_id)
    result3 = flags.is_enabled("rollout_feature", user_id)

    assert result1 == result2 == result3


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================


@pytest.mark.asyncio
async def test_context_gathering_performance(mock_supabase, mock_user_context):
    """Test that context gathering completes within performance target (<100ms)."""
    service = ExerciseSwapService(mock_supabase)

    # Mock fast responses
    service._fetch_onboarding_data = AsyncMock(
        return_value={"experience_level": "intermediate"}
    )
    service._fetch_active_program = AsyncMock(return_value=None)
    service._fetch_active_injuries = AsyncMock(return_value=[])
    service._fetch_current_session = AsyncMock(return_value=None)

    import time

    start = time.time()
    context = await service.gather_user_context("test-user-123")
    elapsed = (time.time() - start) * 1000  # Convert to ms

    # Should complete in under 100ms (parallel execution)
    assert elapsed < 100
    assert context["user_id"] == "test-user-123"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
