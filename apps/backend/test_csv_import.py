"""
Unit tests for CSVImportService

Tests cover:
- CSV parsing and validation
- AI schema detection
- Column mapping
- Data quality checks
- Error handling
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from csv_import_service import CSVImportService
import io


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create CSVImportService instance"""
    return CSVImportService(mock_supabase)


class TestCSVParsing:
    """Test CSV parsing functionality"""

    @pytest.mark.asyncio
    async def test_parse_valid_csv(self, service):
        """Test parsing a valid CSV file"""
        csv_content = """Name,Sets,Reps,Weight
Squat,3,10,135
Bench Press,3,8,185
Deadlift,1,5,315"""
        
        csv_file = io.StringIO(csv_content)
        result = await service.parse_csv(csv_file, "user123")
        
        assert "rows" in result
        assert len(result["rows"]) == 3
        assert result["rows"][0]["Name"] == "Squat"

    @pytest.mark.asyncio
    async def test_parse_csv_with_missing_values(self, service):
        """Test parsing CSV with missing values"""
        csv_content = """Name,Sets,Reps,Weight
Squat,3,10,135
Bench Press,,8,185
Deadlift,1,,315"""
        
        csv_file = io.StringIO(csv_content)
        result = await service.parse_csv(csv_file, "user123")
        
        assert "rows" in result
        assert "warnings" in result
        assert len(result["warnings"]) > 0

    @pytest.mark.asyncio
    async def test_parse_invalid_csv(self, service):
        """Test parsing an invalid CSV file"""
        csv_content = """This is not a valid CSV
Just some random text"""
        
        csv_file = io.StringIO(csv_content)
        
        with pytest.raises(Exception):
            await service.parse_csv(csv_file, "user123")


class TestAISchemaDetection:
    """Test AI-powered schema detection"""

    @pytest.mark.asyncio
    async def test_detect_workout_schema(self, service):
        """Test detecting workout program schema"""
        csv_headers = ["Exercise Name", "Sets", "Reps", "Weight (lbs)", "Rest (sec)"]
        sample_rows = [
            {"Exercise Name": "Squat", "Sets": "3", "Reps": "10", "Weight (lbs)": "135", "Rest (sec)": "90"},
            {"Exercise Name": "Bench Press", "Sets": "3", "Reps": "8", "Weight (lbs)": "185", "Rest (sec)": "120"}
        ]
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"schema_type": "workout_program", "mappings": {"exercise": "Exercise Name", "sets": "Sets", "reps": "Reps", "weight": "Weight (lbs)", "rest": "Rest (sec)"}}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.detect_schema(csv_headers, sample_rows, "user123")
        
        assert result["schema_type"] == "workout_program"
        assert "mappings" in result

    @pytest.mark.asyncio
    async def test_detect_nutrition_schema(self, service):
        """Test detecting nutrition log schema"""
        csv_headers = ["Date", "Meal", "Calories", "Protein", "Carbs", "Fat"]
        sample_rows = [
            {"Date": "2025-01-19", "Meal": "Breakfast", "Calories": "500", "Protein": "30", "Carbs": "50", "Fat": "20"}
        ]
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"schema_type": "nutrition_log", "mappings": {"date": "Date", "meal": "Meal", "calories": "Calories", "protein": "Protein", "carbs": "Carbs", "fat": "Fat"}}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.detect_schema(csv_headers, sample_rows, "user123")
        
        assert result["schema_type"] == "nutrition_log"


class TestColumnMapping:
    """Test column mapping functionality"""

    def test_map_columns_exact_match(self, service):
        """Test mapping with exact column name matches"""
        csv_columns = ["exercise", "sets", "reps", "weight"]
        expected_schema = ["exercise", "sets", "reps", "weight"]
        
        result = service.map_columns(csv_columns, expected_schema)
        
        assert result["exercise"] == "exercise"
        assert result["sets"] == "sets"

    def test_map_columns_fuzzy_match(self, service):
        """Test mapping with fuzzy column name matches"""
        csv_columns = ["Exercise Name", "Set Count", "Rep Count", "Weight (lbs)"]
        expected_schema = ["exercise", "sets", "reps", "weight"]
        
        result = service.map_columns(csv_columns, expected_schema)
        
        # Should map similar names
        assert "exercise" in result
        assert "sets" in result


class TestDataQualityChecks:
    """Test data quality validation"""

    @pytest.mark.asyncio
    async def test_validate_workout_data(self, service):
        """Test validating workout program data"""
        data = [
            {"exercise": "Squat", "sets": 3, "reps": 10, "weight": 135},
            {"exercise": "Bench Press", "sets": 3, "reps": 8, "weight": 185}
        ]
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"valid": true, "issues": [], "suggestions": ["Consider adding rest periods"]}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.validate_data(data, "workout_program", "user123")
        
        assert result["valid"] == True

    @pytest.mark.asyncio
    async def test_validate_data_with_errors(self, service):
        """Test validating data with quality issues"""
        data = [
            {"exercise": "", "sets": 3, "reps": 10, "weight": 135},  # Missing exercise name
            {"exercise": "Bench Press", "sets": -1, "reps": 8, "weight": 185}  # Invalid sets
        ]
        
        mock_ai_response = Mock()
        mock_ai_response.choices = [
            Mock(message=Mock(content='{"valid": false, "issues": ["Row 1: Missing exercise name", "Row 2: Invalid sets value"], "suggestions": []}'))
        ]
        
        with patch.object(service.client.chat.completions, 'create', return_value=mock_ai_response):
            result = await service.validate_data(data, "workout_program", "user123")
        
        assert result["valid"] == False
        assert len(result["issues"]) > 0


class TestImportJob:
    """Test CSV import job management"""

    def test_create_import_job(self, service, mock_supabase):
        """Test creating a CSV import job"""
        job_data = {
            "user_id": "user123",
            "filename": "workout_program.csv",
            "status": "pending"
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[{"id": "job123"}])
        
        result = service.create_import_job(job_data)
        
        assert result["id"] == "job123"

    def test_update_import_job_status(self, service, mock_supabase):
        """Test updating import job status"""
        mock_supabase.table().update().eq().execute.return_value = Mock(data=[{"id": "job123", "status": "completed"}])
        
        result = service.update_import_job_status("job123", "completed")
        
        assert result["status"] == "completed"

