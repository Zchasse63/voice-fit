"""
Unit tests for VoiceSessionService

Tests cover:
- Session lifecycle (create, active, complete, timeout)
- State management
- Session context tracking
- Timeout handling
- Multi-turn conversations
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from voice_session_service import VoiceSessionService


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def service(mock_supabase):
    """Create VoiceSessionService instance"""
    return VoiceSessionService(mock_supabase)


class TestSessionLifecycle:
    """Test session lifecycle management"""

    @pytest.mark.asyncio
    async def test_create_session(self, service, mock_supabase):
        """Test creating a new voice session"""
        session_data = {
            "id": "session123",
            "user_id": "user123",
            "session_type": "planning",
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[session_data])
        
        result = await service.create_session("user123", "planning")
        
        assert result["id"] == "session123"
        assert result["status"] == "active"
        assert result["session_type"] == "planning"

    @pytest.mark.asyncio
    async def test_get_active_session(self, service, mock_supabase):
        """Test retrieving active session for user"""
        session_data = {
            "id": "session123",
            "user_id": "user123",
            "status": "active"
        }
        
        mock_supabase.table().select().eq().eq().execute.return_value = Mock(data=[session_data])
        
        result = await service.get_active_session("user123")
        
        assert result["id"] == "session123"
        assert result["status"] == "active"

    @pytest.mark.asyncio
    async def test_complete_session(self, service, mock_supabase):
        """Test completing a session"""
        updated_session = {
            "id": "session123",
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }
        
        mock_supabase.table().update().eq().execute.return_value = Mock(data=[updated_session])
        
        result = await service.complete_session("session123")
        
        assert result["status"] == "completed"
        assert "completed_at" in result


class TestStateManagement:
    """Test session state management"""

    @pytest.mark.asyncio
    async def test_update_session_context(self, service, mock_supabase):
        """Test updating session context"""
        context = {
            "goal": "Create 4-week strength program",
            "preferences": {"frequency": 4, "duration": 60}
        }
        
        updated_session = {
            "id": "session123",
            "context": context
        }
        
        mock_supabase.table().update().eq().execute.return_value = Mock(data=[updated_session])
        
        result = await service.update_session_context("session123", context)
        
        assert result["context"] == context

    @pytest.mark.asyncio
    async def test_append_to_conversation_history(self, service, mock_supabase):
        """Test appending messages to conversation history"""
        existing_session = {
            "id": "session123",
            "conversation_history": [
                {"role": "user", "content": "I want to build muscle"}
            ]
        }
        
        mock_supabase.table().select().eq().execute.return_value = Mock(data=[existing_session])
        
        new_message = {"role": "assistant", "content": "Great! Let's create a program"}
        
        updated_session = {
            "id": "session123",
            "conversation_history": existing_session["conversation_history"] + [new_message]
        }
        
        mock_supabase.table().update().eq().execute.return_value = Mock(data=[updated_session])
        
        result = await service.append_message("session123", new_message)
        
        assert len(result["conversation_history"]) == 2


class TestTimeoutHandling:
    """Test session timeout logic"""

    @pytest.mark.asyncio
    async def test_check_session_timeout(self, service, mock_supabase):
        """Test checking if session has timed out"""
        # Session created 31 minutes ago (past 30-minute timeout)
        old_timestamp = (datetime.utcnow() - timedelta(minutes=31)).isoformat()
        
        session_data = {
            "id": "session123",
            "last_activity_at": old_timestamp,
            "status": "active"
        }
        
        mock_supabase.table().select().eq().execute.return_value = Mock(data=[session_data])
        
        result = await service.check_timeout("session123")
        
        assert result["timed_out"] == True

    @pytest.mark.asyncio
    async def test_cleanup_expired_sessions(self, service, mock_supabase):
        """Test cleaning up expired sessions"""
        expired_sessions = [
            {"id": "session1", "status": "active"},
            {"id": "session2", "status": "active"}
        ]
        
        # Mock finding expired sessions
        mock_supabase.table().select().lt().eq().execute.return_value = Mock(data=expired_sessions)
        
        # Mock updating them to timeout status
        mock_supabase.table().update().in_().execute.return_value = Mock(data=expired_sessions)
        
        result = await service.cleanup_expired_sessions()
        
        assert result["cleaned_up_count"] == 2


class TestMultiTurnConversations:
    """Test multi-turn conversation handling"""

    @pytest.mark.asyncio
    async def test_planning_session_flow(self, service, mock_supabase):
        """Test a complete planning session flow"""
        # Create session
        session_data = {
            "id": "session123",
            "user_id": "user123",
            "session_type": "planning",
            "status": "active",
            "conversation_history": []
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[session_data])
        mock_supabase.table().select().eq().execute.return_value = Mock(data=[session_data])
        
        session = await service.create_session("user123", "planning")
        
        # Simulate multi-turn conversation
        turns = [
            {"role": "user", "content": "I want to build muscle"},
            {"role": "assistant", "content": "What's your experience level?"},
            {"role": "user", "content": "Intermediate, 2 years training"},
            {"role": "assistant", "content": "How many days per week?"},
            {"role": "user", "content": "4 days"}
        ]
        
        for turn in turns:
            session_data["conversation_history"].append(turn)
            mock_supabase.table().update().eq().execute.return_value = Mock(data=[session_data])
            await service.append_message(session["id"], turn)
        
        # Verify conversation history
        assert len(session_data["conversation_history"]) == 5


class TestSessionTypes:
    """Test different session types"""

    @pytest.mark.asyncio
    async def test_create_check_in_session(self, service, mock_supabase):
        """Test creating a check-in session"""
        session_data = {
            "id": "session123",
            "session_type": "check_in",
            "status": "active"
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[session_data])
        
        result = await service.create_session("user123", "check_in")
        
        assert result["session_type"] == "check_in"

    @pytest.mark.asyncio
    async def test_create_general_session(self, service, mock_supabase):
        """Test creating a general conversation session"""
        session_data = {
            "id": "session123",
            "session_type": "general",
            "status": "active"
        }
        
        mock_supabase.table().insert().execute.return_value = Mock(data=[session_data])
        
        result = await service.create_session("user123", "general")
        
        assert result["session_type"] == "general"

