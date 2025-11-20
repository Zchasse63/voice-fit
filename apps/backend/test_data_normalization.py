"""
Tests for DataNormalizationService

Tests normalization of wearable data from different providers (Terra, WHOOP)
into our unified schema.
"""

import pytest
from datetime import datetime
from decimal import Decimal
from data_normalization_service import DataNormalizationService


@pytest.fixture
def normalization_service():
    """Create DataNormalizationService instance"""
    return DataNormalizationService()


class TestTerraNormalization:
    """Test Terra API data normalization"""

    def test_normalize_terra_sleep(self, normalization_service):
        """Test Terra sleep webhook normalization"""
        terra_payload = {
            "provider": "whoop",
            "data": {
                "id": "sleep_123",
                "start_time": "2025-01-19T22:00:00Z",
                "end_time": "2025-01-20T06:30:00Z",
                "duration_asleep_state_seconds": 27000,  # 7.5 hours
                "duration_light_sleep_state_seconds": 14400,  # 4 hours
                "duration_deep_sleep_state_seconds": 7200,  # 2 hours
                "duration_REM_sleep_state_seconds": 5400,  # 1.5 hours
                "duration_awake_state_seconds": 1800,  # 30 min
                "score": 85,
                "efficiency": 93.75,
                "average_hr_bpm": 55,
                "average_hrv_rmssd": 65,
                "average_breathing_rate": 14,
                "average_spo2_percentage": 97,
            }
        }

        result = normalization_service.normalize_terra_sleep(terra_payload)

        assert result["start_time"] == "2025-01-19T22:00:00Z"
        assert result["end_time"] == "2025-01-20T06:30:00Z"
        assert result["total_duration_minutes"] == 450  # 7.5 hours
        assert result["light_sleep_minutes"] == 240
        assert result["deep_sleep_minutes"] == 120
        assert result["rem_sleep_minutes"] == 90
        assert result["awake_minutes"] == 30
        assert result["sleep_score"] == 85
        assert result["sleep_efficiency"] == 93.75
        assert result["avg_heart_rate"] == 55
        assert result["avg_hrv"] == 65
        assert result["avg_respiratory_rate"] == 14
        assert result["avg_spo2"] == 97
        assert result["source"] == "terra"
        assert result["source_id"] == "sleep_123"

    def test_normalize_terra_activity(self, normalization_service):
        """Test Terra activity webhook normalization"""
        terra_payload = {
            "provider": "garmin",
            "data": {
                "id": "activity_456",
                "start_time": "2025-01-19T10:00:00Z",
                "end_time": "2025-01-19T11:00:00Z",
                "duration_seconds": 3600,
                "activity_type": "running",
                "distance_meters": 8000,
                "active_calories": 450,
                "average_hr_bpm": 145,
                "max_hr_bpm": 165,
                "strain": 12.5,
                "elevation_gain_meters": 100,
                "steps": 10000,
            }
        }

        result = normalization_service.normalize_terra_activity(terra_payload)

        assert result["start_time"] == "2025-01-19T10:00:00Z"
        assert result["end_time"] == "2025-01-19T11:00:00Z"
        assert result["duration_minutes"] == 60
        assert result["activity_type"] == "running"
        assert result["distance_meters"] == 8000
        assert result["calories_burned"] == 450
        assert result["avg_heart_rate"] == 145
        assert result["max_heart_rate"] == 165
        assert result["strain_score"] == 12.5
        assert result["source"] == "terra"
        assert result["metadata"]["elevation_gain"] == 100
        assert result["metadata"]["steps"] == 10000

    def test_normalize_terra_body(self, normalization_service):
        """Test Terra body metrics normalization"""
        terra_payload = {
            "provider": "fitbit",
            "data": {
                "timestamp": "2025-01-19T08:00:00Z",
                "weight_kg": 75.5,
                "body_fat_percentage": 15.2,
                "BMI": 23.5,
            }
        }

        result = normalization_service.normalize_terra_body(terra_payload)

        assert len(result) == 3  # weight, body_fat, bmi
        
        # Check weight metric
        weight_metric = next(m for m in result if m["metric_type"] == "weight")
        assert weight_metric["value_numeric"] == Decimal("75.5")
        assert weight_metric["source"] == "terra"
        assert weight_metric["source_priority"] == 55
        
        # Check body fat metric
        bf_metric = next(m for m in result if m["metric_type"] == "body_fat_percentage")
        assert bf_metric["value_numeric"] == Decimal("15.2")
        
        # Check BMI metric
        bmi_metric = next(m for m in result if m["metric_type"] == "bmi")
        assert bmi_metric["value_numeric"] == Decimal("23.5")

    def test_normalize_terra_daily(self, normalization_service):
        """Test Terra daily summary normalization"""
        terra_payload = {
            "provider": "apple_health",
            "data": {
                "start_time": "2025-01-19T00:00:00Z",
                "steps": 12500,
                "active_duration_seconds": 3600,
                "total_calories": 2400,
                "active_calories": 600,
                "distance_meters": 9000,
                "floors_climbed": 15,
            }
        }

        result = normalization_service.normalize_terra_daily(terra_payload)

        assert result["steps"] == 12500
        assert result["active_minutes"] == 60
        assert result["calories_total"] == 2400
        assert result["calories_active"] == 600
        assert result["distance_meters"] == 9000
        assert result["sources"] == ["terra"]
        assert result["metadata"]["floors_climbed"] == 15


class TestWhoopNormalization:
    """Test WHOOP API data normalization"""

    def test_normalize_whoop_recovery(self, normalization_service):
        """Test WHOOP recovery webhook normalization"""
        whoop_payload = {
            "created_at": "2025-01-19T08:00:00Z",
            "score": {
                "recovery_score": 85,
                "resting_heart_rate": 52,
                "hrv_rmssd_milli": 75,
                "spo2_percentage": 98,
                "skin_temp_celsius": 36.5,
            }
        }

        result = normalization_service.normalize_whoop_recovery(whoop_payload)

        assert len(result) == 5  # recovery, rhr, hrv, spo2, skin_temp
        
        # All metrics should have WHOOP priority (100)
        for metric in result:
            assert metric["source"] == "whoop"
            assert metric["source_priority"] == 100
        
        # Check recovery score
        recovery = next(m for m in result if m["metric_type"] == "recovery_score")
        assert recovery["value_numeric"] == Decimal("85")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

