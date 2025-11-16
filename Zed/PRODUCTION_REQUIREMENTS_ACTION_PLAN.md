# Production Requirements - Action Plan (MUST HAVE)

**Priority:** 🔴 CRITICAL - Required before production launch  
**Created:** January 19, 2025  
**Status:** Planning phase

---

## Overview

Three critical production requirements identified:
1. **Session Persistence** - Currently in-memory only (lost on restart)
2. **Rate Limiting** - No limits on expensive AI endpoints
3. **Upstash Search Configuration** - Inconsistent environment variable naming

---

## 1. Session Persistence (CRITICAL)

### Current State
**Problem:** Sessions stored in-memory in `IntegratedVoiceParser` class
```python
class IntegratedVoiceParser:
    def __init__(self):
        self.sessions = {}  # Lost on restart!
```

**Impact:**
- Sessions lost when Railway restarts backend
- Users lose workout context mid-session
- No cross-device session sharing
- Cannot scale horizontally (sessions tied to single instance)

### Solution Options

#### Option A: Redis (RECOMMENDED)
**Pros:**
- Fast (sub-millisecond latency)
- Built for session storage
- Automatic expiration (TTL)
- Railway has Redis addon

**Cons:**
- Additional cost (~$5/month on Railway)
- External dependency

**Implementation:**
```python
import redis
from datetime import timedelta

class IntegratedVoiceParser:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.redis = redis.from_url(
            os.getenv("REDIS_URL"),
            decode_responses=True
        )
    
    def _get_or_create_session(self, user_id: str):
        # Try Redis first
        session_key = f"session:{user_id}"
        session = self.redis.get(session_key)
        
        if session:
            return json.loads(session)
        
        # Create new session
        session = {
            "session_id": f"session_{user_id}_{int(time.time())}",
            "started_at": datetime.utcnow().isoformat(),
            "total_sets": 0,
            # ...
        }
        
        # Store in Redis with 2-hour expiration
        self.redis.setex(
            session_key,
            timedelta(hours=2),
            json.dumps(session)
        )
        
        return session
    
    def _update_session(self, user_id: str, session: dict):
        session_key = f"session:{user_id}"
        self.redis.setex(
            session_key,
            timedelta(hours=2),
            json.dumps(session)
        )
```

**Environment Variables:**
```bash
REDIS_URL=redis://default:password@redis-host:6379
```

**Railway Setup:**
```bash
# Add Redis addon in Railway dashboard
# OR manually add Upstash Redis
railway add redis
```

#### Option B: Supabase (Good Alternative)
**Pros:**
- Already using Supabase
- No additional cost
- Persistent storage

**Cons:**
- Slower than Redis (~50-100ms vs <1ms)
- Requires cleanup job for expired sessions

**Implementation:**
```sql
-- Create sessions table
CREATE TABLE user_sessions (
    user_id uuid PRIMARY KEY,
    session_id varchar NOT NULL,
    session_data jsonb NOT NULL,
    started_at timestamp NOT NULL,
    last_activity timestamp NOT NULL,
    expires_at timestamp NOT NULL
);

-- Index for cleanup
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

```python
def _get_or_create_session(self, user_id: str):
    # Query Supabase
    result = self.supabase.table("user_sessions")\
        .select("session_data")\
        .eq("user_id", user_id)\
        .gt("expires_at", datetime.utcnow().isoformat())\
        .single()\
        .execute()
    
    if result.data:
        return result.data["session_data"]
    
    # Create new session...
```

### Timeline & Effort
- **Option A (Redis):** 3-4 hours
  - Setup Redis on Railway (30 min)
  - Implement session storage (2 hours)
  - Testing (1 hour)
  - Migration from in-memory (30 min)

- **Option B (Supabase):** 4-5 hours
  - Create table & migration (1 hour)
  - Implement session storage (2 hours)
  - Cleanup job (1 hour)
  - Testing (1 hour)

**Recommendation:** Use Redis (Option A) - faster, simpler, built for this

---

## 2. Rate Limiting (CRITICAL)

### Current State
**Problem:** No rate limits on expensive AI endpoints
- Kimi API calls: ~$0.002 per request
- Grok API calls: ~$0.003 per request
- Users can spam endpoints → high costs

**At-Risk Endpoints:**
- `/api/voice/parse` - Kimi
- `/api/voice/log` - Kimi
- `/api/chat/classify` - Grok
- `/api/coach/ask` - Grok (streaming)
- `/api/injury/analyze` - Grok + RAG
- `/api/chat/swap-exercise-enhanced` - Grok
- `/api/program/generate/*` - Grok
- `/api/workout/insights` - Grok

### Solution: Rate Limiting Middleware

#### Implementation with slowapi (FastAPI rate limiting)

**Install:**
```bash
pip install slowapi
```

**Setup:**
```python
# apps/backend/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to endpoints
@app.post("/api/voice/parse")
@limiter.limit("30/minute")  # 30 requests per minute per IP
async def parse_voice_command(...):
    ...

@app.post("/api/coach/ask")
@limiter.limit("10/minute")  # AI Coach more restricted
async def coach_ask(...):
    ...
```

#### Tier-Based Rate Limits

```python
from fastapi import Header
from typing import Optional

# Rate limit tiers
RATE_LIMITS = {
    "free": {
        "voice": "20/minute",
        "ai_coach": "5/minute",
        "program_gen": "2/hour",
    },
    "premium": {
        "voice": "100/minute",
        "ai_coach": "50/minute",
        "program_gen": "20/hour",
    },
}

def get_user_tier(user: dict) -> str:
    """Get user's subscription tier from JWT"""
    return user.get("tier", "free")

def get_rate_limit_for_user(user: dict, endpoint_type: str) -> str:
    tier = get_user_tier(user)
    return RATE_LIMITS[tier][endpoint_type]

# Apply dynamic rate limit
@app.post("/api/voice/parse")
@limiter.limit(lambda: get_rate_limit_for_user(get_current_user(), "voice"))
async def parse_voice_command(...):
    ...
```

#### With Redis (Better for Distributed)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
import redis

# Use Redis for rate limit storage
redis_client = redis.from_url(os.getenv("REDIS_URL"))

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL")
)
```

### Rate Limit Configuration

```python
# apps/backend/rate_limits.py
RATE_LIMITS = {
    # Voice endpoints (Kimi API ~$0.002/call)
    "voice_parse": {
        "free": "20/minute",
        "premium": "100/minute",
    },
    
    # AI Coach (Grok API ~$0.003/call + RAG)
    "ai_coach": {
        "free": "5/minute",
        "premium": "50/minute",
    },
    
    # Program generation (expensive, long-running)
    "program_generation": {
        "free": "2/hour",
        "premium": "20/hour",
    },
    
    # Injury analysis (Grok + RAG, expensive)
    "injury_analysis": {
        "free": "5/minute",
        "premium": "30/minute",
    },
    
    # Exercise swaps (moderate cost)
    "exercise_swap": {
        "free": "10/minute",
        "premium": "60/minute",
    },
}
```

### Custom Rate Limit Response

```python
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": exc.retry_after,
            "tier": "free",
            "upgrade_url": "https://voicefit.app/premium"
        }
    )
```

### Timeline & Effort
- **Basic rate limiting:** 2-3 hours
  - Install slowapi (5 min)
  - Apply to all AI endpoints (1 hour)
  - Test limits (1 hour)
  - Document limits (30 min)

- **Tier-based limiting:** +2 hours
  - Implement tier detection (1 hour)
  - Configure tier limits (30 min)
  - Testing (30 min)

**Total:** 4-5 hours for complete implementation

---

## 3. Upstash Search Configuration (HIGH PRIORITY)

### Current State
**Problem:** Inconsistent environment variable naming across codebase

**Services using REST naming:**
- `ai_coach_service.py`: `UPSTASH_SEARCH_REST_URL`, `UPSTASH_SEARCH_REST_TOKEN`
- `injury_detection_rag_service.py`: `UPSTASH_SEARCH_REST_URL`, `UPSTASH_SEARCH_REST_TOKEN`
- `integrated_voice_parser.py`: `UPSTASH_SEARCH_REST_URL`, `UPSTASH_SEARCH_REST_TOKEN`
- `smart_namespace_selector.py`: `UPSTASH_SEARCH_REST_URL`, `UPSTASH_SEARCH_REST_TOKEN`

**Services using non-REST naming:**
- `exercise_swap_service.py`: `UPSTASH_SEARCH_URL`, `UPSTASH_SEARCH_TOKEN`

### Solution: Standardize on REST naming

#### Step 1: Fix exercise_swap_service.py

```python
# apps/backend/exercise_swap_service.py (Line 33-34)

# Before:
UPSTASH_SEARCH_URL = os.getenv("UPSTASH_SEARCH_URL")
UPSTASH_SEARCH_TOKEN = os.getenv("UPSTASH_SEARCH_TOKEN")

# After:
UPSTASH_SEARCH_URL = os.getenv("UPSTASH_SEARCH_REST_URL")
UPSTASH_SEARCH_TOKEN = os.getenv("UPSTASH_SEARCH_REST_TOKEN")
```

#### Step 2: Verify Railway Environment Variables

**Required in Railway:**
```bash
UPSTASH_SEARCH_REST_URL=https://your-endpoint.upstash.io
UPSTASH_SEARCH_REST_TOKEN=your-token-here
```

**To check if set:**
```bash
# Via Railway CLI
railway variables list | grep UPSTASH

# Or check Railway dashboard -> Variables tab
```

#### Step 3: Get Upstash Credentials

**If you don't have Upstash account:**
1. Go to https://console.upstash.com/
2. Create account (free tier available)
3. Create Vector Database
4. Get REST URL and Token
5. Add to Railway

**If you have Upstash but credentials not in Railway:**
1. Log into Upstash console
2. Go to your Vector DB
3. Copy REST URL and Token
4. Add to Railway environment variables

#### Step 4: Verify Exercise Index

**Once configured, test exercise matching:**
```python
from upstash_search import Search

client = Search(
    url=os.getenv("UPSTASH_SEARCH_REST_URL"),
    token=os.getenv("UPSTASH_SEARCH_REST_TOKEN")
)

# Test search
index = client.index("exercises")
results = index.search(query="bench press", limit=5)
print(f"Found {len(results)} exercises")
```

**Expected:** Should return exercises from your 482-exercise database

#### Step 5: Fallback Behavior

**Current behavior (GOOD):**
- If Upstash not configured → Falls back to Supabase ✅
- System still works, just slightly slower

**With Upstash configured:**
- Faster exercise matching (~50ms vs ~150ms)
- Better fuzzy matching and typo tolerance
- Reduced load on Supabase

### Timeline & Effort
- **Fix naming inconsistency:** 15 minutes
- **Configure Railway variables:** 5 minutes (if have credentials)
- **Get Upstash account/credentials:** 15 minutes (if needed)
- **Test and verify:** 30 minutes

**Total:** 1 hour

---

## Implementation Priority & Order

### Phase 1: Immediate (This Week)
**Priority:** 🔴 CRITICAL

1. **Rate Limiting** (4-5 hours) - MOST URGENT
   - Protects against cost spikes immediately
   - Can be deployed independently
   - No data migration needed
   
2. **Upstash Configuration** (1 hour)
   - Quick win, improves performance
   - Already has fallback in place
   - Low risk

### Phase 2: Short-term (Next Week)
**Priority:** 🟠 HIGH

3. **Session Persistence** (3-4 hours)
   - Requires Redis setup
   - Data migration from in-memory
   - Testing with real users

---

## Detailed Implementation Steps

### Step 1: Rate Limiting (Day 1)

**Morning (2 hours):**
```bash
# 1. Install dependencies
cd apps/backend
pip install slowapi redis

# 2. Update requirements.txt
echo "slowapi==0.1.9" >> requirements.txt
echo "redis==5.0.1" >> requirements.txt

# 3. Git commit
git add requirements.txt
git commit -m "feat: Add rate limiting dependencies"
```

**Afternoon (2-3 hours):**
```python
# 4. Create rate_limits.py
# (See configuration above)

# 5. Update main.py
# (See implementation above)

# 6. Apply to all AI endpoints
# - /api/voice/parse
# - /api/voice/log
# - /api/chat/classify
# - /api/coach/ask
# - /api/injury/analyze
# - /api/program/generate/*
# - etc.

# 7. Test locally
pytest tests/test_rate_limits.py

# 8. Deploy
git add .
git commit -m "feat: Implement rate limiting on AI endpoints"
git push origin main
```

### Step 2: Upstash Configuration (Day 1 or 2)

**15 minutes:**
```bash
# 1. Fix naming inconsistency
# Edit apps/backend/exercise_swap_service.py
# Change UPSTASH_SEARCH_URL → UPSTASH_SEARCH_REST_URL

# 2. Commit
git add apps/backend/exercise_swap_service.py
git commit -m "fix: Standardize Upstash env var naming"
git push origin main
```

**30 minutes:**
```bash
# 3. Configure Railway
railway login
railway link
railway variables set UPSTASH_SEARCH_REST_URL=https://your-endpoint.upstash.io
railway variables set UPSTASH_SEARCH_REST_TOKEN=your-token-here

# 4. Verify
railway logs --tail
# Look for: "✅ Upstash Search configured"

# 5. Test exercise matching
curl -X POST https://voice-fit-production.up.railway.app/api/voice/parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "bench press 185 for 8"}'

# Should return exercise_id (not null)
```

### Step 3: Session Persistence (Day 3-4)

**Setup Redis (30 min):**
```bash
# Option A: Railway addon
railway add redis

# Option B: Upstash Redis (free tier)
# 1. Go to https://console.upstash.com/redis
# 2. Create database
# 3. Get REDIS_URL
# 4. Add to Railway:
railway variables set REDIS_URL=redis://...
```

**Implementation (2-3 hours):**
```python
# 1. Update integrated_voice_parser.py
# (See implementation above)

# 2. Add Redis dependency
pip install redis

# 3. Test migration
# Run with both in-memory and Redis side-by-side
# Verify sessions persist across restarts

# 4. Deploy
git add .
git commit -m "feat: Add Redis session persistence"
git push origin main
```

**Migration strategy:**
```python
# Gradual rollout
USE_REDIS = os.getenv("USE_REDIS_SESSIONS", "false") == "true"

def _get_or_create_session(self, user_id: str):
    if USE_REDIS:
        return self._get_redis_session(user_id)
    else:
        return self._get_memory_session(user_id)
```

---

## Testing Checklist

### Rate Limiting Tests
- [ ] Hit endpoint 21 times in 1 minute → expect 429 error
- [ ] Wait 1 minute → expect requests to work again
- [ ] Test premium user has higher limits
- [ ] Test different endpoints have different limits
- [ ] Test Redis rate limit storage (distributed)

### Upstash Configuration Tests
- [ ] Exercise matching returns exercise_id (not null)
- [ ] Fuzzy matching works ("benchpress" → "Bench Press")
- [ ] Typo tolerance works ("benc press" → "Bench Press")
- [ ] Performance < 100ms for exercise matching
- [ ] Fallback to Supabase works if Upstash fails

### Session Persistence Tests
- [ ] Create session → restart backend → session still exists
- [ ] Session expires after 2 hours of inactivity
- [ ] Multiple devices share same session (same user_id)
- [ ] Session updates persist (set count, current exercise)
- [ ] End session properly cleans up Redis key

---

## Cost Analysis

### Redis (Session Persistence)
**Option A: Railway Redis Addon**
- Cost: ~$5/month
- Included: 25MB storage, 1000 connections

**Option B: Upstash Redis Free Tier**
- Cost: $0 (free tier)
- Limits: 10,000 commands/day
- Upgrade: $0.20 per 100k commands

**Recommendation:** Start with Upstash free tier

### Rate Limiting
- Cost: $0 (using slowapi with Redis)
- Saves: Prevents unlimited AI API costs
- ROI: Pays for itself by preventing abuse

### Upstash Search
**Free Tier:**
- 10,000 searches/day
- 1GB storage
- Cost: $0

**If exceed free tier:**
- $0.40 per 100k searches
- Estimated usage: ~5,000 searches/day (under free tier)

**Total Additional Monthly Cost: ~$5-10**

---

## Monitoring & Alerts

### Rate Limit Monitoring
```python
# Track rate limit hits
@app.middleware("http")
async def track_rate_limits(request: Request, call_next):
    response = await call_next(request)
    
    if response.status_code == 429:
        # Log to monitoring service
        log_rate_limit_hit(
            user_id=request.state.user_id,
            endpoint=request.url.path,
            tier=request.state.user_tier
        )
    
    return response
```

### Session Monitoring
```python
# Monitor session activity
async def monitor_sessions():
    session_count = redis_client.dbsize()
    avg_session_age = calculate_avg_session_age()
    
    metrics.gauge("active_sessions", session_count)
    metrics.gauge("avg_session_age_minutes", avg_session_age)
```

### Upstash Monitoring
```python
# Monitor search performance
async def monitor_upstash():
    start = time.time()
    try:
        results = index.search("test", limit=1)
        latency_ms = (time.time() - start) * 1000
        metrics.gauge("upstash_latency_ms", latency_ms)
        metrics.increment("upstash_success")
    except Exception as e:
        metrics.increment("upstash_failure")
```

---

## Success Criteria

### Rate Limiting
- ✅ 429 errors returned when limits exceeded
- ✅ Different limits for free vs premium users
- ✅ No AI API cost spikes
- ✅ Rate limit headers in response

### Session Persistence
- ✅ Sessions survive backend restarts
- ✅ Session data persists for 2 hours
- ✅ Cross-device session sharing works
- ✅ Redis latency < 5ms for session ops

### Upstash Search
- ✅ Environment variables set correctly
- ✅ Exercise matching < 100ms
- ✅ Fuzzy matching works
- ✅ Fallback to Supabase functional

---

## Rollback Plan

### If Rate Limiting Breaks
```python
# Emergency disable
ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "true") == "true"

if ENABLE_RATE_LIMITING:
    @limiter.limit("30/minute")
    ...
```

### If Redis Breaks
```python
# Fall back to in-memory
try:
    session = get_redis_session(user_id)
except:
    session = get_memory_session(user_id)
```

### If Upstash Breaks
- Already has fallback to Supabase ✅
- No rollback needed

---

## Timeline Summary

| Task | Duration | Priority | Can Start |
|------|----------|----------|-----------|
| Rate Limiting | 4-5 hours | 🔴 CRITICAL | Immediately |
| Upstash Config | 1 hour | 🟠 HIGH | Immediately |
| Session Persistence | 3-4 hours | 🟠 HIGH | After Redis setup |

**Total Time:** 8-10 hours  
**Completion Target:** 2-3 days  
**Production Ready:** After all three complete

---

## Next Steps (Action Items)

1. **Today:**
   - [ ] Implement rate limiting (4-5 hours)
   - [ ] Fix Upstash naming inconsistency (15 min)
   - [ ] Configure Upstash in Railway (30 min)

2. **Tomorrow:**
   - [ ] Setup Redis (Railway or Upstash)
   - [ ] Implement session persistence (3-4 hours)
   - [ ] Test all three features together

3. **Day 3:**
   - [ ] Full integration testing
   - [ ] Monitor costs and performance
   - [ ] Deploy to production

**After completion:** All three critical requirements will be met and system will be production-ready!