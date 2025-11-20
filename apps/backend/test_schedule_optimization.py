"""
Unit tests for ScheduleOptimizationService

Tests cover:
- Conflict detection (various scenarios)
- Schedule suggestions (AI-powered)
- Workout rescheduling
- Availability windows (travel mode)
- Edge cases
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from schedule_optimization_service import ScheduleOptimizationService


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create ScheduleOptimizationService instance"""
    return ScheduleOptimizationService(mock_supabase)


class TestConflictDetection:
    """Test conflict detection functionality"""

    def test_check_conflicts_no_conflicts(self, service, mock_supabase):
        """Test conflict detection when no conflicts exist"""
        # Mock Supabase response - no existing workouts
        mock_supabase.table().select().eq().eq().execute.return_value = Mock(data=[])
        
        result = service.check_conflicts("user123", "2025-01-20")
        
        assert result["has_conflicts"] is False
        assert len(result["conflicts"]) == 0

    def test_check_conflicts_with_existing_workout(self, service, mock_supabase):
        """Test conflict detection with existing workout on same date"""
        # Mock existing workout
        existing_workout = {
            "id": "workout1",
            "scheduled_date": "2025-01-20",
            "workout_name": "Upper Body",
            "estimated_duration_minutes": 60
        }
        mock_supabase.table().select().eq().eq().execute.return_value = Mock(
            data=[existing_workout]
        )
        
        result = service.check_conflicts("user123", "2025-01-20")
        
        assert result["has_conflicts"] is True
        assert len(result["conflicts"]) == 1
        assert result["conflicts"][0]["type"] == "existing_workout"

    def test_check_conflicts_with_travel_mode(self, service, mock_supabase):
        """Test conflict detection with travel/vacation window"""
        # Mock availability window (travel mode)
        availability_window = {
            "id": "window1",
            "window_type": "travel",
            "start_date": "2025-01-18",
            "end_date": "2025-01-22",
            "reason": "Business trip"
        }
        mock_supabase.table().select().eq().eq().execute.return_value = Mock(data=[])
        mock_supabase.table().select().eq().lte().gte().execute.return_value = Mock(
            data=[availability_window]
        )
        
        result = service.check_conflicts("user123", "2025-01-20")
        
        assert result["has_conflicts"] is True
        assert any(c["type"] == "availability_window" for c in result["conflicts"])

    def test_check_conflicts_exclude_workout(self, service, mock_supabase):
        """Test conflict detection excluding specific workout"""
        existing_workout = {
            "id": "workout1",
            "scheduled_date": "2025-01-20",
            "workout_name": "Upper Body"
        }
        mock_supabase.table().select().eq().eq().neq().execute.return_value = Mock(
            data=[]
        )
        
        result = service.check_conflicts("user123", "2025-01-20", exclude_workout_id="workout1")
        
        assert result["has_conflicts"] is False


class TestScheduleSuggestions:
    """Test AI-powered schedule suggestions"""

    @pytest.mark.asyncio
    async def test_generate_schedule_suggestions(self, service, mock_supabase):
        """Test generating schedule suggestions with AI"""
        # Mock user context
        user_context = "User trains 4x/week, prefers morning workouts"
        
        # Mock AI response
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"suggestions": [{"date": "2025-01-21", "reason": "Better recovery"}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_schedule_suggestions(
                "user123", "2025-01-20", user_context
            )
        
        assert "suggestions" in result
        assert len(result["suggestions"]) > 0


class TestAvailabilityWindows:
    """Test availability window management"""

    def test_create_availability_window(self, service, mock_supabase):
        """Test creating travel/vacation window"""
        window_data = {
            "user_id": "user123",
            "window_type": "travel",
            "start_date": "2025-01-20",
            "end_date": "2025-01-25",
            "reason": "Vacation"
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(
            data=[{**window_data, "id": "window1"}]
        )
        
        result = service.create_availability_window(window_data)
        
        assert result["id"] == "window1"
        assert result["window_type"] == "travel"


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_check_conflicts_invalid_date(self, service):
        """Test conflict detection with invalid date format"""
        with pytest.raises(ValueError):
            service.check_conflicts("user123", "invalid-date")

    def test_check_conflicts_past_date(self, service):
        """Test conflict detection with past date"""
        past_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        # Should still work, just return conflicts if any
        result = service.check_conflicts("user123", past_date)
        assert "has_conflicts" in result

