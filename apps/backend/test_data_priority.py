"""
Tests for DataPriorityService

Tests conflict resolution when multiple wearable sources provide the same metric.
"""

import pytest
from datetime import date
from decimal import Decimal
from unittest.mock import Mock, MagicMock
from data_priority_service import DataPriorityService


@pytest.fixture
def mock_supabase():
    """Create mock Supabase client"""
    return Mock()


@pytest.fixture
def priority_service(mock_supabase):
    """Create DataPriorityService instance with mock client"""
    return DataPriorityService(mock_supabase)


class TestSourcePriority:
    """Test source priority mapping"""

    def test_get_source_priority_whoop(self, priority_service):
        """WHOOP should have highest priority (100)"""
        assert priority_service.get_source_priority("whoop") == 100

    def test_get_source_priority_oura(self, priority_service):
        """Oura should have priority 95"""
        assert priority_service.get_source_priority("oura") == 95

    def test_get_source_priority_garmin(self, priority_service):
        """Garmin should have priority 80"""
        assert priority_service.get_source_priority("garmin") == 80

    def test_get_source_priority_apple_health(self, priority_service):
        """Apple Health should have priority 60"""
        assert priority_service.get_source_priority("apple_health") == 60

    def test_get_source_priority_unknown(self, priority_service):
        """Unknown sources should have default priority 30"""
        assert priority_service.get_source_priority("unknown_device") == 30

    def test_get_source_priority_case_insensitive(self, priority_service):
        """Source priority should be case-insensitive"""
        assert priority_service.get_source_priority("WHOOP") == 100
        assert priority_service.get_source_priority("Whoop") == 100


class TestMetricConflictResolution:
    """Test metric conflict resolution logic"""

    def test_resolve_conflict_no_existing_metric(self, priority_service, mock_supabase):
        """Should insert when no existing metric exists"""
        # Mock empty result
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        decision = priority_service.resolve_metric_conflict(
            user_id="user123",
            metric_date=date(2025, 1, 19),
            metric_type="recovery_score",
            new_value=Decimal("85"),
            new_source="whoop"
        )

        assert decision["action"] == "insert"
        assert decision["reason"] == "No existing metric found"
        assert decision["priority"] == 100

    def test_resolve_conflict_same_source_exists(self, priority_service, mock_supabase):
        """Should update when same source already exists"""
        # Mock existing metric from same source
        mock_result = Mock()
        mock_result.data = [
            {"id": "metric123", "source": "whoop", "value_numeric": 80}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        decision = priority_service.resolve_metric_conflict(
            user_id="user123",
            metric_date=date(2025, 1, 19),
            metric_type="recovery_score",
            new_value=Decimal("85"),
            new_source="whoop"
        )

        assert decision["action"] == "update"
        assert "Updating existing whoop metric" in decision["reason"]
        assert decision["existing_id"] == "metric123"

    def test_resolve_conflict_higher_priority_source(self, priority_service, mock_supabase):
        """Should insert when new source has higher priority"""
        # Mock existing metric from lower priority source
        mock_result = Mock()
        mock_result.data = [
            {"id": "metric123", "source": "apple_health", "value_numeric": 80}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        decision = priority_service.resolve_metric_conflict(
            user_id="user123",
            metric_date=date(2025, 1, 19),
            metric_type="recovery_score",
            new_value=Decimal("85"),
            new_source="whoop"  # Priority 100 vs Apple Health 60
        )

        assert decision["action"] == "insert"
        assert "higher priority" in decision["reason"]
        assert decision["priority"] == 100

    def test_resolve_conflict_lower_priority_source(self, priority_service, mock_supabase):
        """Should skip when new source has lower priority"""
        # Mock existing metric from higher priority source
        mock_result = Mock()
        mock_result.data = [
            {"id": "metric123", "source": "whoop", "value_numeric": 85}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        decision = priority_service.resolve_metric_conflict(
            user_id="user123",
            metric_date=date(2025, 1, 19),
            metric_type="recovery_score",
            new_value=Decimal("80"),
            new_source="apple_health"  # Priority 60 vs WHOOP 100
        )

        assert decision["action"] == "skip"
        assert "lower priority" in decision["reason"]

    def test_resolve_conflict_equal_priority(self, priority_service, mock_supabase):
        """Should insert when priorities are equal (keep both for comparison)"""
        # Mock existing metric from same priority source
        mock_result = Mock()
        mock_result.data = [
            {"id": "metric123", "source": "garmin", "value_numeric": 80}
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        decision = priority_service.resolve_metric_conflict(
            user_id="user123",
            metric_date=date(2025, 1, 19),
            metric_type="resting_hr",
            new_value=Decimal("55"),
            new_source="polar"  # Both have priority 75-80
        )

        assert decision["action"] == "insert"
        assert "equal priority" in decision["reason"]


class TestDailySummaryMerge:
    """Test daily summary merging logic"""

    def test_merge_daily_summary_no_existing(self, priority_service, mock_supabase):
        """Should use new data when no existing summary"""
        # Mock empty result
        mock_result = Mock()
        mock_result.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

        new_data = {
            "date": date(2025, 1, 19),
            "steps": 10000,
            "calories_total": 2400,
        }

        merged = priority_service.merge_daily_summary(
            user_id="user123",
            summary_date=date(2025, 1, 19),
            new_data=new_data,
            source="garmin"
        )

        assert merged["steps"] == 10000
        assert merged["calories_total"] == 2400
        assert merged["sources"] == ["garmin"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

