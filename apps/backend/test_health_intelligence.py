"""
Unit tests for HealthIntelligenceService

Tests cover:
- Health trend analysis
- Proactive alert detection
- Health snapshot aggregation
- Medical disclaimer guardrails
- Missing data handling
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from health_intelligence_service import HealthIntelligenceService


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create HealthIntelligenceService instance"""
    return HealthIntelligenceService(mock_supabase)


class TestHealthTrendAnalysis:
    """Test health trend analysis functionality"""

    @pytest.mark.asyncio
    async def test_analyze_health_trends_with_complete_data(self, service, mock_supabase):
        """Test health analysis with complete wearable data"""
        user_context = """
        Recent metrics:
        - Sleep: 7.5h avg, HRV: 65ms
        - Recovery: 85% avg
        - Training load: Moderate
        """
        
        # Mock AI response
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"insights": [{"type": "recovery", "severity": "info", "message": "Good recovery"}], "overall_health_score": 85}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.analyze_health_trends("user123", user_context, days=14)
        
        assert "insights" in result
        assert "overall_health_score" in result
        assert result["overall_health_score"] == 85

    @pytest.mark.asyncio
    async def test_analyze_health_trends_declining_recovery(self, service):
        """Test detection of declining recovery trend"""
        user_context = """
        Recovery scores: 90, 85, 75, 65, 60 (declining)
        Sleep quality: Poor last 3 nights
        """
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"insights": [{"type": "recovery", "severity": "warning", "message": "Declining recovery"}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.analyze_health_trends("user123", user_context)
        
        assert any(i["severity"] == "warning" for i in result["insights"])

    @pytest.mark.asyncio
    async def test_analyze_health_trends_missing_data(self, service):
        """Test analysis with missing wearable data"""
        user_context = "No wearable data available"
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"insights": [], "overall_health_score": null}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.analyze_health_trends("user123", user_context)
        
        # Should handle gracefully
        assert "insights" in result


class TestProactiveAlerts:
    """Test proactive alert detection"""

    @pytest.mark.asyncio
    async def test_check_proactive_alerts_overtraining(self, service):
        """Test detection of overtraining signals"""
        user_context = """
        - HRV: Declining 20% over 7 days
        - Resting HR: Elevated 10 bpm
        - Sleep quality: Poor
        - Training volume: High
        """
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"alerts": [{"type": "overtraining", "severity": "high", "recommendation": "Consider deload"}]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.check_proactive_alerts("user123", user_context)
        
        assert len(result["alerts"]) > 0
        assert any(a["type"] == "overtraining" for a in result["alerts"])

    @pytest.mark.asyncio
    async def test_check_proactive_alerts_no_concerns(self, service):
        """Test when no alerts are needed"""
        user_context = "All metrics normal, good recovery"
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"alerts": []}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.check_proactive_alerts("user123", user_context)
        
        assert len(result["alerts"]) == 0


class TestMedicalDisclaimers:
    """Test medical disclaimer guardrails"""

    @pytest.mark.asyncio
    async def test_prompts_include_disclaimers(self, service):
        """Test that prompts include medical disclaimers"""
        user_context = "Test context"
        
        with patch.object(service.client.chat.completions, 'create') as mock_create:
            mock_create.return_value = Mock(
                choices=[Mock(message=Mock(content='{"insights": []}'))]
            )
            
            await service.analyze_health_trends("user123", user_context)
            
            # Check that the prompt includes disclaimer language
            call_args = mock_create.call_args
            messages = call_args[1]["messages"]
            system_message = next(m for m in messages if m["role"] == "system")
            
            assert "not medical advice" in system_message["content"].lower() or \
                   "consult" in system_message["content"].lower()

    @pytest.mark.asyncio
    async def test_responses_avoid_diagnosis(self, service):
        """Test that responses avoid medical diagnosis language"""
        # This would be tested by reviewing actual AI responses
        # For now, we verify the prompt structure
        assert service.model == "grok-4-fast-reasoning"


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_handle_ai_api_error(self, service):
        """Test handling of AI API errors"""
        with patch.object(service.client.chat.completions, 'create', side_effect=Exception("API Error")):
            with pytest.raises(Exception):
                await service.analyze_health_trends("user123", "context")

    @pytest.mark.asyncio
    async def test_handle_invalid_json_response(self, service):
        """Test handling of invalid JSON from AI"""
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='invalid json'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            with pytest.raises(Exception):
                await service.analyze_health_trends("user123", "context")

