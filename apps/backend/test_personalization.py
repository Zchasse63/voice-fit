"""
Unit tests for PersonalizationService

Tests cover:
- User preference retrieval
- Preference updates
- AI-powered preference extraction from conversation
- Preference validation
- Default preferences
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from personalization_service import PersonalizationService


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create PersonalizationService instance"""
    return PersonalizationService(mock_supabase)


class TestPreferenceRetrieval:
    """Test user preference retrieval"""

    def test_get_user_preferences_existing(self, service, mock_supabase):
        """Test retrieving existing user preferences"""
        existing_prefs = {
            "user_id": "user123",
            "equipment_available": ["barbell", "dumbbells"],
            "preferred_session_length": 45,
            "training_days_per_week": 4
        }
        
        mock_supabase.table().select().eq().single().execute.return_value = Mock(
            data=existing_prefs
        )
        
        result = service.get_user_preferences("user123")
        
        assert result["user_id"] == "user123"
        assert result["preferred_session_length"] == 45

    def test_get_user_preferences_create_defaults(self, service, mock_supabase):
        """Test creating default preferences when none exist"""
        # Mock no existing preferences
        mock_supabase.table().select().eq().single().execute.side_effect = Exception("Not found")
        
        # Mock insert
        default_prefs = {
            "user_id": "user123",
            "equipment_available": [],
            "preferred_session_length": 60,
            "training_days_per_week": 3
        }
        mock_supabase.table().insert().execute.return_value = Mock(data=[default_prefs])
        
        result = service.get_user_preferences("user123")
        
        assert result["user_id"] == "user123"
        assert "equipment_available" in result


class TestPreferenceUpdates:
    """Test preference update functionality"""

    def test_update_preferences_partial(self, service, mock_supabase):
        """Test partial preference updates"""
        updates = {
            "preferred_session_length": 30,
            "training_days_per_week": 5
        }
        
        updated_prefs = {
            "user_id": "user123",
            **updates,
            "updated_at": datetime.now().isoformat()
        }
        
        mock_supabase.table().update().eq().execute.return_value = Mock(
            data=[updated_prefs]
        )
        
        result = service.update_preferences("user123", updates)
        
        assert result["preferred_session_length"] == 30
        assert result["training_days_per_week"] == 5

    def test_update_preferences_equipment(self, service, mock_supabase):
        """Test updating equipment preferences"""
        updates = {
            "equipment_available": ["barbell", "dumbbells", "pull-up bar"]
        }
        
        mock_supabase.table().update().eq().execute.return_value = Mock(
            data=[{"user_id": "user123", **updates}]
        )
        
        result = service.update_preferences("user123", updates)
        
        assert len(result["equipment_available"]) == 3


class TestConversationalExtraction:
    """Test AI-powered preference extraction"""

    @pytest.mark.asyncio
    async def test_extract_preferences_from_conversation(self, service):
        """Test extracting preferences from natural language"""
        conversation = "I only have 30 minutes on weekdays and I train 4 times per week"
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"preferred_session_length": 30, "training_days_per_week": 4}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.extract_preferences_from_conversation("user123", conversation)
        
        assert "extracted_preferences" in result
        assert result["extracted_preferences"]["preferred_session_length"] == 30

    @pytest.mark.asyncio
    async def test_extract_equipment_preferences(self, service):
        """Test extracting equipment from conversation"""
        conversation = "I have a barbell and dumbbells at home"
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"equipment_available": ["barbell", "dumbbells"]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.extract_preferences_from_conversation("user123", conversation)
        
        assert "barbell" in result["extracted_preferences"]["equipment_available"]


class TestPreferenceValidation:
    """Test preference data validation"""

    def test_validate_session_length(self, service):
        """Test session length validation"""
        # Valid session lengths
        valid_updates = {"preferred_session_length": 45}
        # Should not raise error
        
        # Invalid session length (negative)
        invalid_updates = {"preferred_session_length": -10}
        # Should handle gracefully or raise validation error

    def test_validate_training_days(self, service):
        """Test training days validation"""
        # Valid: 1-7 days
        valid_updates = {"training_days_per_week": 4}
        
        # Invalid: >7 days
        invalid_updates = {"training_days_per_week": 10}


class TestDefaultPreferences:
    """Test default preference handling"""

    def test_default_preferences_structure(self, service, mock_supabase):
        """Test that default preferences have correct structure"""
        mock_supabase.table().select().eq().single().execute.side_effect = Exception("Not found")
        
        default_prefs = {
            "user_id": "user123",
            "equipment_available": [],
            "preferred_session_length": 60,
            "training_days_per_week": 3,
            "preferred_training_times": [],
            "mobility_focus": False
        }
        mock_supabase.table().insert().execute.return_value = Mock(data=[default_prefs])
        
        result = service.get_user_preferences("user123")
        
        assert "equipment_available" in result
        assert "preferred_session_length" in result
        assert "training_days_per_week" in result


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_extract_no_preferences_found(self, service):
        """Test extraction when no preferences in conversation"""
        conversation = "Hello, how are you?"
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.extract_preferences_from_conversation("user123", conversation)
        
        assert result["extracted_preferences"] == {}

    def test_update_preferences_empty(self, service, mock_supabase):
        """Test updating with empty dict"""
        mock_supabase.table().update().eq().execute.return_value = Mock(
            data=[{"user_id": "user123"}]
        )
        
        result = service.update_preferences("user123", {})
        assert result["user_id"] == "user123"

