"""
Unit tests for WarmupCooldownService

Tests cover:
- Warmup generation (various workout types)
- Cooldown generation (various workout types)
- Injury-aware selection
- Template matching logic
- Multi-sport warmups
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from warmup_cooldown_service import WarmupCooldownService


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create WarmupCooldownService instance"""
    return WarmupCooldownService(mock_supabase)


class TestWarmupGeneration:
    """Test warmup generation functionality"""

    @pytest.mark.asyncio
    async def test_generate_warmup_strength(self, service):
        """Test generating warmup for strength workout"""
        workout_context = {
            "workout_type": "strength",
            "primary_movements": ["squat", "bench press"],
            "duration_minutes": 60
        }
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "Dynamic stretching", "duration": 5}, {"name": "Light cardio", "duration": 5}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_warmup("user123", workout_context)
        
        assert "exercises" in result
        assert len(result["exercises"]) > 0

    @pytest.mark.asyncio
    async def test_generate_warmup_cardio(self, service):
        """Test generating warmup for cardio workout"""
        workout_context = {
            "workout_type": "cardio",
            "activity": "running",
            "duration_minutes": 45
        }
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "Walking", "duration": 5}, {"name": "Dynamic leg swings", "duration": 3}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_warmup("user123", workout_context)
        
        assert "exercises" in result


class TestCooldownGeneration:
    """Test cooldown generation functionality"""

    @pytest.mark.asyncio
    async def test_generate_cooldown_strength(self, service):
        """Test generating cooldown for strength workout"""
        workout_context = {
            "workout_type": "strength",
            "muscle_groups": ["legs", "back"],
            "duration_minutes": 60
        }
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "Static stretching", "duration": 10}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_cooldown("user123", workout_context)
        
        assert "exercises" in result

    @pytest.mark.asyncio
    async def test_generate_cooldown_cardio(self, service):
        """Test generating cooldown for cardio workout"""
        workout_context = {
            "workout_type": "cardio",
            "activity": "cycling",
            "duration_minutes": 60
        }
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "Easy spin", "duration": 5}, {"name": "Leg stretches", "duration": 5}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_cooldown("user123", workout_context)
        
        assert "exercises" in result


class TestInjuryAwareSelection:
    """Test injury-aware warmup/cooldown selection"""

    @pytest.mark.asyncio
    async def test_warmup_with_injury_flags(self, service):
        """Test warmup generation with injury considerations"""
        workout_context = {
            "workout_type": "strength",
            "primary_movements": ["squat"],
            "injury_flags": ["knee_pain"]
        }
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "Knee-friendly warmup", "duration": 10}], "modifications": ["Avoid deep squats"]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_warmup("user123", workout_context)
        
        # Should include modifications for injury
        assert "modifications" in result or "exercises" in result


class TestTemplateMatching:
    """Test template selection logic"""

    def test_get_warmup_templates(self, service, mock_supabase):
        """Test retrieving warmup templates"""
        templates = [
            {"id": "1", "name": "Strength Warmup", "workout_type": "strength"},
            {"id": "2", "name": "Cardio Warmup", "workout_type": "cardio"}
        ]
        
        mock_supabase.table().select().eq().execute.return_value = Mock(data=templates)
        
        result = service.get_warmup_templates("strength")
        
        assert len(result) > 0

    def test_get_cooldown_templates(self, service, mock_supabase):
        """Test retrieving cooldown templates"""
        templates = [
            {"id": "1", "name": "Strength Cooldown", "workout_type": "strength"}
        ]
        
        mock_supabase.table().select().eq().execute.return_value = Mock(data=templates)
        
        result = service.get_cooldown_templates("strength")
        
        assert len(result) > 0


class TestMultiSportWarmups:
    """Test multi-sport warmup generation"""

    @pytest.mark.asyncio
    async def test_generate_triathlon_warmup(self, service):
        """Test generating warmup for triathlon workout"""
        workout_context = {
            "workout_type": "multi_sport",
            "sports": ["swim", "bike", "run"],
            "primary_sport": "swim",
            "duration_minutes": 90
        }
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "Swim-specific warmup", "duration": 10}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_warmup("user123", workout_context)
        
        assert "exercises" in result


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_generate_warmup_missing_context(self, service):
        """Test warmup generation with minimal context"""
        workout_context = {}
        
        # Should handle gracefully or use defaults
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"exercises": [{"name": "General warmup", "duration": 5}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.generate_warmup("user123", workout_context)
        
        assert "exercises" in result

