# Voice Session Management Design Specification

## Overview
VoiceFit's voice-first UX requires stateful conversation sessions with timeout handling, off-topic detection, and personality-driven responses to maintain engaging, contextual interactions.

## Architecture

### Session Lifecycle

```
┌─────────────┐
│   START     │
│  Session    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │◄──────┐
│  (30 min)   │       │
└──────┬──────┘       │
       │              │
       │ Activity     │
       ├──────────────┘
       │
       │ 30 min idle
       ▼
┌─────────────┐
│  EXPIRING   │
│  (5 min)    │
└──────┬──────┘
       │
       │ No activity
       ▼
┌─────────────┐
│   EXPIRED   │
│  (cleanup)  │
└─────────────┘
```

### Session States

1. **ACTIVE**: Session is active, user is engaged
   - Duration: 30 minutes from last activity
   - Actions: Accept all queries, maintain context

2. **EXPIRING**: Session is about to expire
   - Duration: 5 minutes warning period
   - Actions: Notify user, accept queries to extend

3. **EXPIRED**: Session has timed out
   - Actions: Clear context, require new session start
   - Cleanup: Archive conversation history

### Database Schema

**voice_sessions table** (already exists):
```sql
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) CHECK (status IN ('active', 'expiring', 'expired')),
  context JSONB DEFAULT '{}'::jsonb,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_status ON voice_sessions(status);
CREATE INDEX idx_voice_sessions_expires ON voice_sessions(expires_at);
```

### Core Components

#### 1. VoiceSessionService
**Location**: `apps/backend/voice_session_service.py` (already exists)

**Key Methods**:
- `create_session(user_id)` - Start new session
- `get_active_session(user_id)` - Get or create active session
- `update_activity(session_id)` - Extend session on activity
- `check_expiration(session_id)` - Check if session is expiring
- `expire_session(session_id)` - Mark session as expired
- `cleanup_expired_sessions()` - Background cleanup job

**Session Timeout Logic**:
```python
ACTIVE_DURATION = 30 * 60  # 30 minutes
WARNING_DURATION = 5 * 60  # 5 minutes

def update_activity(session_id):
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=ACTIVE_DURATION)
    
    # Update session
    session = supabase.table('voice_sessions').update({
        'last_activity_at': now.isoformat(),
        'expires_at': expires_at.isoformat(),
        'status': 'active'
    }).eq('id', session_id).execute()
    
    return session.data[0]

def check_expiration(session_id):
    session = get_session(session_id)
    now = datetime.utcnow()
    expires_at = datetime.fromisoformat(session['expires_at'])
    
    time_remaining = (expires_at - now).total_seconds()
    
    if time_remaining <= 0:
        return {'status': 'expired', 'time_remaining': 0}
    elif time_remaining <= WARNING_DURATION:
        return {'status': 'expiring', 'time_remaining': time_remaining}
    else:
        return {'status': 'active', 'time_remaining': time_remaining}
```

#### 2. ChatClassifier Updates
**Location**: `apps/backend/chat_classifier.py`

**Add Off-Topic Detection**:
```python
def classify_query(query: str) -> Dict[str, Any]:
    """
    Classify user query into categories
    
    Categories:
    - workout_planning
    - exercise_form
    - nutrition
    - recovery
    - progress_tracking
    - general_fitness
    - off_topic (NEW)
    """
    
    # Off-topic keywords
    off_topic_keywords = [
        'weather', 'news', 'politics', 'sports scores',
        'movie', 'recipe', 'travel', 'shopping'
    ]
    
    query_lower = query.lower()
    
    # Check for off-topic
    if any(keyword in query_lower for keyword in off_topic_keywords):
        return {
            'category': 'off_topic',
            'confidence': 0.9,
            'suggested_response': 'humorous_redirect'
        }
    
    # ... existing classification logic ...
```

#### 3. PersonalityEngine Updates
**Location**: `apps/backend/personality_engine.py`

**Add Humorous Off-Topic Responses**:
```python
OFF_TOPIC_RESPONSES = [
    "I'm a fitness coach, not a weatherman! But I can tell you it's always a good day for a workout. 💪",
    "That's outside my wheelhouse! I'm better at counting reps than counting calories in pizza. 🍕",
    "I'd love to help, but my expertise is in burpees, not {topic}. Want to talk training instead?",
    "Nice try! But I'm programmed to help you get stronger, not to {action}. What's your fitness goal?",
    "I'm flattered you think I know about that, but I'm just a simple AI coach. Let's talk gains! 🏋️"
]

def get_off_topic_response(query: str) -> str:
    """Generate humorous response for off-topic queries"""
    import random
    response = random.choice(OFF_TOPIC_RESPONSES)
    
    # Personalize based on query
    if 'weather' in query.lower():
        return "I'm a fitness coach, not a meteorologist! But I can predict you'll feel amazing after today's workout. ☀️"
    elif 'recipe' in query.lower():
        return "I'm better at prescribing workouts than recipes! But I can help you hit your macro targets. 🍳"
    else:
        return response
```

### Mobile UI Updates

#### ChatScreen Updates
**Location**: `apps/mobile/src/screens/ChatScreen.tsx`

**Add Session State Indicator**:
```typescript
interface SessionState {
  status: 'active' | 'expiring' | 'expired';
  timeRemaining: number; // seconds
}

// Display session timer
{sessionState.status === 'expiring' && (
  <View style={styles.sessionWarning}>
    <Text style={styles.warningText}>
      ⏰ Session expiring in {Math.floor(sessionState.timeRemaining / 60)} minutes
    </Text>
  </View>
)}
```

#### VoiceService Updates
**Location**: `apps/mobile/src/services/VoiceService.ts`

**Pass session_id in API calls**:
```typescript
async sendVoiceMessage(audioBlob: Blob, sessionId?: string) {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }
  
  const response = await fetch('/api/coach/voice', {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}
```

### API Endpoints

**Session Management** (already implemented):
- `POST /api/voice/session/start` - Start new session
- `GET /api/voice/session/status` - Check session status
- `POST /api/voice/session/extend` - Extend session
- `DELETE /api/voice/session/end` - End session

**Updated Chat Endpoints**:
- `POST /api/coach/ask` - Accept optional `session_id` parameter
- `POST /api/coach/voice` - Accept optional `session_id` parameter

### Background Jobs

**Session Cleanup Cron**:
```python
# Run every 5 minutes
async def cleanup_expired_sessions():
    """Mark expired sessions and archive conversations"""
    now = datetime.utcnow()
    
    # Find expired sessions
    expired = supabase.table('voice_sessions').update({
        'status': 'expired'
    }).lt('expires_at', now.isoformat()).eq('status', 'active').execute()
    
    # Archive conversations (optional)
    for session in expired.data:
        archive_conversation(session['id'])
```

### Success Metrics

1. **Session Duration**: Average session length
2. **Engagement Rate**: Messages per session
3. **Timeout Rate**: % of sessions that expire vs. explicitly ended
4. **Off-Topic Rate**: % of queries classified as off-topic
5. **User Satisfaction**: Feedback on personality responses

### Future Enhancements

1. **Adaptive Timeouts**: Adjust timeout based on user behavior
2. **Session Resume**: Allow resuming expired sessions with context
3. **Multi-Device Sessions**: Sync sessions across devices
4. **Voice Activity Detection**: Auto-extend on voice input
5. **Conversation Summaries**: Generate summaries on session end

