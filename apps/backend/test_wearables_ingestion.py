"""
Unit tests for WearablesIngestionService

Tests cover:
- Terra webhook ingestion
- WHOOP webhook ingestion
- Webhook signature verification
- Data normalization
- Metric priority handling
- Error handling
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from wearables_ingestion_service import WearablesIngestionService
import hashlib
import hmac


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create WearablesIngestionService instance"""
    return WearablesIngestionService(mock_supabase)


class TestTerraIngestion:
    """Test Terra webhook ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_terra_sleep_data(self, service, mock_supabase):
        """Test ingesting sleep data from Terra"""
        terra_payload = {
            "type": "sleep",
            "user": {"user_id": "terra_user123"},
            "data": {
                "sleep_durations_data": {
                    "asleep": {"duration_asleep_state_seconds": 28800}
                },
                "heart_rate_data": {
                    "summary": {"avg_hr_bpm": 55}
                }
            }
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[{"id": "event123"}])
        mock_supabase.table().upsert().execute.return_value = Mock(data=[{"id": "metric123"}])
        
        result = await service.ingest_terra_webhook(terra_payload, "user123")
        
        assert result["success"] == True
        assert result["provider"] == "terra"

    @pytest.mark.asyncio
    async def test_ingest_terra_activity_data(self, service, mock_supabase):
        """Test ingesting activity data from Terra"""
        terra_payload = {
            "type": "activity",
            "user": {"user_id": "terra_user123"},
            "data": {
                "distance_data": {"distance_meters": 5000},
                "calories_data": {"total_burned_calories": 350}
            }
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[{"id": "event123"}])
        mock_supabase.table().upsert().execute.return_value = Mock(data=[{"id": "metric123"}])
        
        result = await service.ingest_terra_webhook(terra_payload, "user123")
        
        assert result["success"] == True


class TestWHOOPIngestion:
    """Test WHOOP webhook ingestion"""

    @pytest.mark.asyncio
    async def test_ingest_whoop_recovery_data(self, service, mock_supabase):
        """Test ingesting recovery data from WHOOP"""
        whoop_payload = {
            "type": "recovery",
            "user_id": "whoop_user123",
            "data": {
                "recovery_score": 85,
                "hrv": 65,
                "resting_heart_rate": 48
            }
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[{"id": "event123"}])
        mock_supabase.table().upsert().execute.return_value = Mock(data=[{"id": "metric123"}])
        
        result = await service.ingest_whoop_webhook(whoop_payload, "user123")
        
        assert result["success"] == True
        assert result["provider"] == "whoop"

    @pytest.mark.asyncio
    async def test_ingest_whoop_strain_data(self, service, mock_supabase):
        """Test ingesting strain data from WHOOP"""
        whoop_payload = {
            "type": "workout",
            "user_id": "whoop_user123",
            "data": {
                "strain": 15.2,
                "average_heart_rate": 145,
                "max_heart_rate": 178
            }
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[{"id": "event123"}])
        mock_supabase.table().upsert().execute.return_value = Mock(data=[{"id": "metric123"}])
        
        result = await service.ingest_whoop_webhook(whoop_payload, "user123")
        
        assert result["success"] == True


class TestWebhookVerification:
    """Test webhook signature verification"""

    def test_verify_terra_signature(self, service):
        """Test verifying Terra webhook signature"""
        payload = '{"type":"sleep","user":{"user_id":"123"}}'
        secret = "terra_webhook_secret"
        
        # Generate valid signature
        signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        result = service.verify_terra_signature(payload, signature, secret)
        
        assert result == True

    def test_verify_terra_signature_invalid(self, service):
        """Test rejecting invalid Terra signature"""
        payload = '{"type":"sleep","user":{"user_id":"123"}}'
        secret = "terra_webhook_secret"
        invalid_signature = "invalid_signature_here"
        
        result = service.verify_terra_signature(payload, invalid_signature, secret)
        
        assert result == False

    def test_verify_whoop_signature(self, service):
        """Test verifying WHOOP webhook signature"""
        payload = '{"type":"recovery","user_id":"123"}'
        secret = "whoop_webhook_secret"
        
        # Generate valid signature
        signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        result = service.verify_whoop_signature(payload, signature, secret)
        
        assert result == True


class TestDataNormalization:
    """Test data normalization across providers"""

    def test_normalize_sleep_data(self, service):
        """Test normalizing sleep data from different providers"""
        terra_sleep = {
            "sleep_durations_data": {
                "asleep": {"duration_asleep_state_seconds": 28800}
            }
        }
        
        normalized = service.normalize_sleep_data(terra_sleep, "terra")
        
        assert "duration_hours" in normalized
        assert normalized["duration_hours"] == 8.0

    def test_normalize_heart_rate_data(self, service):
        """Test normalizing heart rate data"""
        whoop_hr = {
            "resting_heart_rate": 48,
            "average_heart_rate": 145
        }
        
        normalized = service.normalize_heart_rate_data(whoop_hr, "whoop")
        
        assert "resting_hr" in normalized
        assert normalized["resting_hr"] == 48


class TestMetricPriority:
    """Test metric source priority handling"""

    @pytest.mark.asyncio
    async def test_whoop_priority_for_recovery(self, service, mock_supabase):
        """Test that WHOOP takes priority for recovery metrics"""
        # Existing metric from Apple Health
        existing_metric = {
            "user_id": "user123",
            "date": "2025-01-19",
            "metric_type": "recovery",
            "source": "apple_health",
            "value_numeric": 70
        }
        
        mock_supabase.table().select().eq().eq().eq().execute.return_value = Mock(data=[existing_metric])
        
        # New metric from WHOOP (higher priority)
        whoop_metric = {
            "user_id": "user123",
            "date": "2025-01-19",
            "metric_type": "recovery",
            "source": "whoop",
            "value_numeric": 85
        }
        
        mock_supabase.table().upsert().execute.return_value = Mock(data=[whoop_metric])
        
        result = await service.upsert_metric(whoop_metric)
        
        # WHOOP should override Apple Health
        assert result["source"] == "whoop"
        assert result["value_numeric"] == 85


class TestErrorHandling:
    """Test error handling for ingestion"""

    @pytest.mark.asyncio
    async def test_handle_malformed_payload(self, service):
        """Test handling malformed webhook payload"""
        malformed_payload = {
            "type": "unknown",
            # Missing required fields
        }
        
        with pytest.raises(Exception):
            await service.ingest_terra_webhook(malformed_payload, "user123")

    @pytest.mark.asyncio
    async def test_handle_database_error(self, service, mock_supabase):
        """Test handling database errors during ingestion"""
        terra_payload = {
            "type": "sleep",
            "user": {"user_id": "terra_user123"},
            "data": {}
        }
        
        # Simulate database error
        mock_supabase.table().insert().execute.side_effect = Exception("Database error")
        
        with pytest.raises(Exception):
            await service.ingest_terra_webhook(terra_payload, "user123")

