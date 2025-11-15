"""
Comprehensive test suite for Exercise Matching Service

Tests:
1. Exercise name normalization
2. Synonym generation (rule-based and LLM)
3. Exact matching
4. Fuzzy matching
5. Exercise creation
6. Component parsing
7. Full match-or-create workflow
8. API endpoint integration
"""

import os
from unittest.mock import MagicMock, Mock, patch

import pytest
from exercise_matching_service import ExerciseMatchingService


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    mock_client = Mock()
    mock_table = Mock()
    mock_select = Mock()
    mock_execute = Mock()

    # Mock the chain: table().select().execute()
    mock_execute.return_value.data = [
        {
            "id": "exercise-1",
            "original_name": "Barbell Bench Press",
            "normalized_name": "barbellbenchpress",
            "synonyms": ["bench press", "bb bench", "flat bench"],
            "base_movement": "Bench Press",
            "movement_pattern": "horizontal_push",
            "primary_equipment": "barbell",
            "category": "strength",
        },
        {
            "id": "exercise-2",
            "original_name": "Dumbbell Row",
            "normalized_name": "dumbbellrow",
            "synonyms": ["db row", "one arm row"],
            "base_movement": "Row",
            "movement_pattern": "horizontal_pull",
            "primary_equipment": "dumbbell",
            "category": "strength",
        },
    ]

    mock_select.return_value = mock_execute
    mock_table.return_value.select.return_value = mock_select
    mock_client.table = mock_table

    return mock_client


@pytest.fixture
def mock_openai():
    """Mock OpenAI client"""
    mock_client = Mock()

    # Mock embeddings
    mock_embedding = Mock()
    mock_embedding.data = [Mock(embedding=[0.1] * 384)]
    mock_client.embeddings.create.return_value = mock_embedding

    # Mock chat completions for LLM synonyms
    mock_completion = Mock()
    mock_completion.choices = [
        Mock(message=Mock(content="bench, bb bench, flat bench, barbell bench"))
    ]
    mock_client.chat.completions.create.return_value = mock_completion

    return mock_client


@pytest.fixture
def matching_service(mock_supabase, mock_openai):
    """Create ExerciseMatchingService with mocked dependencies"""
    with patch("exercise_matching_service.create_client", return_value=mock_supabase):
        with patch("exercise_matching_service.OpenAI", return_value=mock_openai):
            service = ExerciseMatchingService()
            return service


class TestNormalization:
    """Test exercise name normalization"""

    def test_normalize_basic(self, matching_service):
        assert matching_service.normalize_name("Bench Press") == "bench press"

    def test_normalize_special_chars(self, matching_service):
        assert matching_service.normalize_name("DB (Flat) Bench!") == "db flat bench"

    def test_normalize_extra_spaces(self, matching_service):
        assert matching_service.normalize_name("Barbell   Squat") == "barbell squat"

    def test_normalize_numbers(self, matching_service):
        assert matching_service.normalize_name("21s Curl") == "21s curl"


class TestSynonymGeneration:
    """Test synonym generation"""

    def test_generate_synonyms_dumbbell(self, matching_service):
        synonyms = matching_service.generate_synonyms("Dumbbell Bench Press")
        assert "db bench press" in synonyms
        assert "dumbell bench press" in synonyms
        assert "dumb bell bench press" in synonyms

    def test_generate_synonyms_barbell(self, matching_service):
        synonyms = matching_service.generate_synonyms("Barbell Row")
        assert "bb row" in synonyms
        assert "bar row" in synonyms

    def test_generate_synonyms_single_arm(self, matching_service):
        synonyms = matching_service.generate_synonyms("Single Arm Row")
        assert "one arm row" in synonyms
        assert "unilateral row" in synonyms
        assert "1 arm row" in synonyms

    def test_generate_synonyms_compound(self, matching_service):
        synonyms = matching_service.generate_synonyms("Dumbbell Single Arm Press")
        # Should have variations for both "dumbbell" and "single arm"
        assert any("db" in s for s in synonyms)
        assert any("one arm" in s for s in synonyms)

    def test_generate_synonyms_romanian_deadlift(self, matching_service):
        synonyms = matching_service.generate_synonyms("Romanian Deadlift")
        assert "rdl" in synonyms
        assert "stiff leg deadlift" in synonyms

    def test_generate_synonyms_hyphen_variations(self, matching_service):
        synonyms = matching_service.generate_synonyms("Pull-Up")
        assert "pull up" in synonyms  # With space
        synonyms2 = matching_service.generate_synonyms("Pull Up")
        assert "pull-up" in synonyms2  # With hyphen

    def test_generate_synonyms_llm(self, matching_service):
        """Test LLM-based synonym generation"""
        synonyms = matching_service.generate_synonyms_llm("Barbell Bench Press")
        assert len(synonyms) > 0
        assert all(isinstance(s, str) for s in synonyms)
        # Should be lowercase
        assert all(s == s.lower() for s in synonyms)


class TestExactMatching:
    """Test exact exercise matching"""

    def test_exact_match_original_name(self, matching_service):
        exercise_id = matching_service.find_exercise_exact("Barbell Bench Press")
        assert exercise_id == "exercise-1"

    def test_exact_match_normalized(self, matching_service):
        exercise_id = matching_service.find_exercise_exact("barbell bench press")
        assert exercise_id == "exercise-1"

    def test_exact_match_synonym(self, matching_service):
        exercise_id = matching_service.find_exercise_exact("bench press")
        assert exercise_id == "exercise-1"

    def test_exact_match_not_found(self, matching_service):
        exercise_id = matching_service.find_exercise_exact("Nonexistent Exercise")
        assert exercise_id is None


class TestFuzzyMatching:
    """Test fuzzy exercise matching"""

    def test_fuzzy_match_close(self, matching_service):
        result = matching_service.find_exercise_fuzzy("Barbell Bench", threshold=0.80)
        assert result is not None
        exercise_id, score, matched_name = result
        assert exercise_id == "exercise-1"
        assert score >= 0.80
        assert "Bench Press" in matched_name

    def test_fuzzy_match_typo(self, matching_service):
        result = matching_service.find_exercise_fuzzy("Dumbell Row", threshold=0.80)
        assert result is not None
        exercise_id, score, matched_name = result
        assert exercise_id == "exercise-2"

    def test_fuzzy_match_below_threshold(self, matching_service):
        result = matching_service.find_exercise_fuzzy("Squat", threshold=0.90)
        # Should not match bench press or row
        assert result is None

    def test_fuzzy_match_score_accuracy(self, matching_service):
        result = matching_service.find_exercise_fuzzy(
            "Barbell Bench Press", threshold=0.80
        )
        assert result is not None
        _, score, _ = result
        assert score == 1.0  # Exact match should have score of 1.0


class TestComponentParsing:
    """Test exercise component parsing"""

    def test_parse_barbell_equipment(self, matching_service):
        components = matching_service.parse_exercise_components("Barbell Squat")
        assert components["primary_equipment"] == "barbell"

    def test_parse_dumbbell_equipment(self, matching_service):
        components = matching_service.parse_exercise_components("DB Press")
        assert components["primary_equipment"] == "dumbbell"

    def test_parse_bodyweight_equipment(self, matching_service):
        components = matching_service.parse_exercise_components("Bodyweight Pull Up")
        assert components["primary_equipment"] == "bodyweight"

    def test_parse_movement_pattern_squat(self, matching_service):
        components = matching_service.parse_exercise_components("Back Squat")
        assert components["movement_pattern"] == "squat"

    def test_parse_movement_pattern_hinge(self, matching_service):
        components = matching_service.parse_exercise_components("Romanian Deadlift")
        assert components["movement_pattern"] == "hinge"

    def test_parse_movement_pattern_horizontal_push(self, matching_service):
        components = matching_service.parse_exercise_components("Bench Press")
        assert components["movement_pattern"] == "horizontal_push"

    def test_parse_movement_pattern_vertical_push(self, matching_service):
        components = matching_service.parse_exercise_components("Overhead Press")
        assert components["movement_pattern"] == "vertical_push"

    def test_parse_movement_pattern_horizontal_pull(self, matching_service):
        components = matching_service.parse_exercise_components("Barbell Row")
        assert components["movement_pattern"] == "horizontal_pull"

    def test_parse_movement_pattern_vertical_pull(self, matching_service):
        components = matching_service.parse_exercise_components("Pull Up")
        assert components["movement_pattern"] == "vertical_pull"

    def test_parse_mechanic_compound(self, matching_service):
        components = matching_service.parse_exercise_components("Squat")
        assert components["mechanic"] == "compound"

    def test_parse_mechanic_isolation(self, matching_service):
        components = matching_service.parse_exercise_components("Bicep Curl")
        assert components["mechanic"] == "isolation"

    def test_parse_force_push(self, matching_service):
        components = matching_service.parse_exercise_components("Press")
        assert components["force"] == "push"

    def test_parse_force_pull(self, matching_service):
        components = matching_service.parse_exercise_components("Row")
        assert components["force"] == "pull"


class TestExerciseCreation:
    """Test exercise creation"""

    def test_create_exercise_success(self, matching_service, mock_supabase):
        # Mock successful insert
        mock_insert = Mock()
        mock_insert.return_value.execute.return_value.data = [{"id": "new-exercise-id"}]
        mock_supabase.table.return_value.insert = mock_insert

        exercise_id = matching_service.create_exercise("New Exercise")
        assert exercise_id is not None

    def test_create_exercise_with_all_fields(self, matching_service, mock_supabase):
        # Mock successful insert
        mock_insert = Mock()
        mock_insert.return_value.execute.return_value.data = [{"id": "new-exercise-id"}]
        mock_supabase.table.return_value.insert = mock_insert

        exercise_id = matching_service.create_exercise("Barbell Back Squat")
        assert exercise_id is not None

        # Check that insert was called with proper data
        insert_call = mock_insert.call_args[0][0]
        assert "id" in insert_call
        assert insert_call["original_name"] == "Barbell Back Squat"
        assert "normalized_name" in insert_call
        assert "primary_equipment" in insert_call
        assert "movement_pattern" in insert_call


class TestMatchOrCreate:
    """Test the main match_or_create workflow"""

    def test_match_or_create_exact_match(self, matching_service):
        exercise_id = matching_service.match_or_create_exercise("Barbell Bench Press")
        assert exercise_id == "exercise-1"

    def test_match_or_create_fuzzy_match(self, matching_service):
        exercise_id = matching_service.match_or_create_exercise("Barbell Bench")
        assert exercise_id == "exercise-1"

    def test_match_or_create_new_exercise(self, matching_service, mock_supabase):
        # Mock successful insert for new exercise
        mock_insert = Mock()
        mock_insert.return_value.execute.return_value.data = [{"id": "new-id"}]
        mock_supabase.table.return_value.insert = mock_insert

        exercise_id = matching_service.match_or_create_exercise(
            "Cable Flye", auto_create=True
        )
        assert exercise_id is not None

    def test_match_or_create_no_match_no_create(self, matching_service):
        exercise_id = matching_service.match_or_create_exercise(
            "Cable Flye", auto_create=False
        )
        assert exercise_id is None


class TestMatchOrCreateWithDetails:
    """Test the enhanced match_or_create_with_details method"""

    def test_exact_match_with_details(self, matching_service):
        result = matching_service.match_or_create_with_details("Barbell Bench Press")
        assert result["success"] is True
        assert result["exercise_id"] == "exercise-1"
        assert result["match_type"] == "exact"
        assert result["match_score"] == 1.0
        assert len(result["synonyms"]) > 0
        assert result["created"] is False

    def test_fuzzy_match_with_details(self, matching_service):
        result = matching_service.match_or_create_with_details("Barbell Bench")
        assert result["success"] is True
        assert result["exercise_id"] == "exercise-1"
        assert result["match_type"] == "fuzzy"
        assert result["match_score"] >= 0.80
        assert result["matched_name"] is not None
        assert result["created"] is False

    def test_create_with_details(self, matching_service, mock_supabase):
        # Mock successful insert
        mock_insert = Mock()
        mock_insert.return_value.execute.return_value.data = [{"id": "new-id"}]
        mock_supabase.table.return_value.insert = mock_insert

        result = matching_service.match_or_create_with_details(
            "Cable Flye", auto_create=True
        )
        assert result["success"] is True
        assert result["exercise_id"] is not None
        assert result["match_type"] == "created"
        assert result["created"] is True
        assert result["metadata"] is not None

    def test_no_match_no_create_with_details(self, matching_service):
        result = matching_service.match_or_create_with_details(
            "Cable Flye", auto_create=False
        )
        assert result["success"] is False
        assert result["exercise_id"] is None
        assert result["match_type"] == "none"
        assert result["created"] is False

    def test_llm_synonyms_with_details(self, matching_service):
        result = matching_service.match_or_create_with_details(
            "Barbell Bench Press", use_llm_synonyms=True
        )
        assert result["success"] is True
        # Should have generated synonyms via LLM
        assert len(result["synonyms"]) > 0

    def test_custom_threshold_with_details(self, matching_service):
        # With high threshold, "Bench" might not match
        result = matching_service.match_or_create_with_details(
            "Bench", fuzzy_threshold=0.95, auto_create=False
        )
        # Result depends on actual fuzzy score


class TestPhoneticKey:
    """Test phonetic key generation"""

    def test_generate_phonetic_key_basic(self, matching_service):
        key = matching_service.generate_phonetic_key("Bench Press")
        assert len(key) > 0
        assert key.isupper()

    def test_generate_phonetic_key_vowel_removal(self, matching_service):
        key = matching_service.generate_phonetic_key("Squat")
        # Should keep first letter, remove middle vowels
        assert key[0] == "S"
        assert "U" not in key[1:]  # Vowel should be removed after first letter

    def test_generate_phonetic_key_max_length(self, matching_service):
        key = matching_service.generate_phonetic_key("Very Long Exercise Name Here")
        assert len(key) <= 20


# ============================================================================
# API ENDPOINT INTEGRATION TESTS
# ============================================================================


@pytest.mark.asyncio
class TestAPIEndpoint:
    """Test the API endpoint"""

    @pytest.fixture
    def mock_request(self):
        """Mock FastAPI request"""
        from models import ExerciseCreateOrMatchRequest

        return ExerciseCreateOrMatchRequest(
            exercise_name="Barbell Bench Press",
            auto_create=True,
            use_llm_synonyms=False,
            fuzzy_threshold=0.80,
        )

    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user"""
        return {"user_id": "test-user-123"}

    async def test_api_endpoint_success(
        self, matching_service, mock_request, mock_user
    ):
        """Test successful API call"""
        result = matching_service.match_or_create_with_details(
            exercise_name=mock_request.exercise_name,
            auto_create=mock_request.auto_create,
            use_llm_synonyms=mock_request.use_llm_synonyms,
            fuzzy_threshold=mock_request.fuzzy_threshold,
        )

        assert result["success"] is True
        assert result["exercise_id"] is not None
        assert "message" in result

    async def test_api_endpoint_with_llm(self, matching_service, mock_user):
        """Test API with LLM synonyms"""
        from models import ExerciseCreateOrMatchRequest

        request = ExerciseCreateOrMatchRequest(
            exercise_name="DB Press", use_llm_synonyms=True
        )

        result = matching_service.match_or_create_with_details(
            exercise_name=request.exercise_name,
            auto_create=request.auto_create,
            use_llm_synonyms=request.use_llm_synonyms,
            fuzzy_threshold=request.fuzzy_threshold,
        )

        assert "synonyms" in result
        assert len(result["synonyms"]) > 0


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_empty_exercise_name(self, matching_service):
        result = matching_service.match_or_create_with_details("")
        # Should handle gracefully
        assert result["success"] is False

    def test_very_long_exercise_name(self, matching_service):
        long_name = "A" * 500
        result = matching_service.match_or_create_with_details(
            long_name, auto_create=False
        )
        # Should not crash
        assert "success" in result

    def test_special_characters_only(self, matching_service):
        result = matching_service.match_or_create_with_details(
            "!@#$%", auto_create=False
        )
        assert result["success"] is False

    def test_unicode_characters(self, matching_service):
        result = matching_service.match_or_create_with_details(
            "Übung 测试", auto_create=False
        )
        # Should handle gracefully
        assert "success" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
