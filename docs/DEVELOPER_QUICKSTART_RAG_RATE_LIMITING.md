# Developer Quickstart: RAG Integration & Rate Limiting

**Quick reference for integrating RAG and rate limiting into VoiceFit endpoints**

---

## Table of Contents

1. [Rate Limiting (Automatic)](#rate-limiting-automatic)
2. [RAG Integration (Manual)](#rag-integration-manual)
3. [Caching](#caching)
4. [Environment Setup](#environment-setup)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Rate Limiting (Automatic)

### Overview

Rate limiting is **automatic** via middleware. No code changes needed in your endpoint!

### How It Works

1. Middleware extracts JWT token from `Authorization` header
2. Extracts user tier from JWT claims (`user_metadata.tier`)
3. Checks rate limits based on tier and endpoint
4. Returns 429 if limit exceeded, otherwise allows request

### Tier Limits

| Tier | Default | Expensive Endpoints |
|------|---------|---------------------|
| Free | 60/hour | 10/minute |
| Premium | 300/hour | 50/minute |
| Admin | Unlimited | Unlimited |

### Expensive Endpoints

AI-powered endpoints have stricter per-minute limits:
- `/api/program/generate/*`
- `/api/coach/ask`
- `/api/injury/analyze`
- `/api/running/analyze`
- `/api/workout/insights`

### JWT Token Format

Your JWT must include tier information:

```python
{
    "sub": "user_id_123",
    "email": "user@example.com",
    "aud": "authenticated",
    "user_metadata": {
        "tier": "premium"  # or "free" or "admin"
    }
}
```

### Response Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Tier: free
```

### 429 Response

When rate limit is exceeded:

```json
{
    "error": "Rate limit exceeded",
    "message": "Too many requests. Please retry after 45 seconds.",
    "retry_after": 45,
    "tier": "free",
    "endpoint": "/api/coach/ask",
    "remaining": 0
}
```

Headers include:
```
Retry-After: 45
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

### Exempt Endpoints

These endpoints bypass rate limiting:
- `/` (root)
- `/health`
- `/docs`
- `/openapi.json`
- `/redoc`

### Disabling Rate Limiting

For development:

```bash
export ENABLE_RATE_LIMITING=false
```

---

## RAG Integration (Manual)

### Overview

RAG (Retrieval-Augmented Generation) uses SmartNamespaceSelector to retrieve relevant knowledge from Upstash Search and inject it into LLM prompts.

### Step 1: Add RAG Service Dependency

```python
from rag_integration_service import get_rag_service

@app.post("/api/my-endpoint")
async def my_endpoint(
    request: MyRequest,
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    ...
```

### Step 2: Build User Context

```python
# Build comprehensive user context
user_context = await context_builder.build_context(request.user_id)
```

### Step 3: Get RAG Context

```python
# Get RAG context (automatically cached)
rag_context = rag_service.get_rag_context(
    endpoint="/api/my-endpoint",           # Your endpoint path
    request_data=request.dict(),            # Request data for transformer
    user_context=user_context,              # User context for enrichment
    max_chunks=40,                          # Number of chunks to retrieve
    use_cache=True,                         # Enable caching (recommended)
    cache_ttl=3600                          # Cache for 1 hour
)
```

### Step 4: Pass to Service

```python
# Call your service with RAG context
result = my_service.process(
    request=request,
    user_context=user_context,
    rag_context=rag_context  # Pass RAG context to service
)
```

### Step 5: Update Service Method

Your service must accept `rag_context` parameter:

```python
class MyService:
    def process(self, request, user_context, rag_context=None):
        # Use rag_context in your LLM prompt
        prompt = f"""
        {rag_context}
        
        User request: {request.question}
        User context: {user_context}
        
        Generate response...
        """
        
        response = llm.generate(prompt)
        return response
```

### Customizing RAG Retrieval

#### Adjust Chunk Count

```python
# More chunks = more context (but slower, more expensive)
rag_context = rag_service.get_rag_context(
    ...,
    max_chunks=60  # Default: 40-50
)
```

#### Adjust Cache TTL

```python
# Shorter TTL for frequently changing data
rag_context = rag_service.get_rag_context(
    ...,
    cache_ttl=1800  # 30 minutes instead of 1 hour
)
```

#### Disable Caching

```python
# For testing or real-time data
rag_context = rag_service.get_rag_context(
    ...,
    use_cache=False
)
```

#### Get Structured Chunks

If you need raw chunks instead of formatted text:

```python
chunks = rag_service.get_rag_chunks(
    endpoint="/api/my-endpoint",
    request_data=request.dict(),
    user_context=user_context,
    max_chunks=40
)

# chunks is a list of dicts with:
# - text: chunk content
# - namespace: source namespace
# - score: relevance score
# - content_type: principle/exercise/programming/recovery/concept
# - metadata: additional metadata
```

### Adding a New Transformer

If your endpoint needs a custom transformer:

1. Add transformer method to `RAGIntegrationService`:

```python
def transform_my_feature(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform my feature request into questionnaire format."""
    return {
        "primary_goal": request_data.get("goal", "general"),
        "experience_level": "intermediate",
        "context_hints": ["relevant", "namespace", "hints"],
        "virtual_goal": "my_feature_goal",
    }
```

2. Update `_transform_by_endpoint()`:

```python
def _transform_by_endpoint(self, endpoint, request_data, user_context):
    if "/my-endpoint" in endpoint:
        return self.transform_my_feature(request_data)
    # ... existing conditions
```

---

## Caching

### Automatic Caching

RAG contexts are **automatically cached** when you use `use_cache=True`.

Cache key format: `rag:context:{endpoint}:{hash(questionnaire)}`

### Manual Caching

For other data:

```python
from redis_client import get_cache_manager

cache = get_cache_manager()

# Simple get/set
cache.set("my_key", value, ttl=3600)
value = cache.get("my_key")

# Get or compute
value = cache.get_or_set(
    key="expensive_computation:user123",
    value_fn=lambda: expensive_function(),
    ttl=3600
)

# Delete
cache.delete("my_key")
```

### Specialized Caching Helpers

#### User Context

```python
from redis_client import (
    cache_user_context,
    get_cached_user_context,
    invalidate_user_context
)

# Cache
cache_user_context(user_id="user123", context_data={...}, ttl=3600)

# Retrieve
cached = get_cached_user_context(user_id="user123")

# Invalidate (call after user data changes)
invalidate_user_context(user_id="user123")
```

#### Exercise Matches

```python
from redis_client import (
    cache_exercise_match,
    get_cached_exercise_match
)

# Cache positive match (7 days)
cache_exercise_match(query="bench press", exercise_id="123", ttl=604800)

# Retrieve
cached = get_cached_exercise_match(query="bench press")
```

#### AI Responses

```python
from redis_client import (
    cache_ai_response,
    get_cached_ai_response
)

# Cache response (24 hours for general, 1 hour for personalized)
cache_ai_response(query="what is RPE?", response="...", ttl=86400)

# Retrieve
cached = get_cached_ai_response(query="what is RPE?")
```

### Cache Invalidation Triggers

Invalidate caches when data changes:

```python
# After logging workout
invalidate_user_context(user_id)

# After injury report
invalidate_user_context(user_id)

# After program change
invalidate_user_context(user_id)
```

---

## Environment Setup

### Required Variables

```bash
# Rate Limiting
ENABLE_RATE_LIMITING=true
SUPABASE_JWT_SECRET=your-jwt-secret

# RAG
UPSTASH_SEARCH_REST_URL=https://your-search.upstash.io
UPSTASH_SEARCH_REST_TOKEN=your-search-token

# Caching
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Development Mode

```bash
# Disable rate limiting for testing
ENABLE_RATE_LIMITING=false

# Disable auth for local development
REQUIRE_AUTH=false
```

---

## Common Patterns

### Pattern 1: Simple RAG Integration

```python
@app.post("/api/feature")
async def feature_endpoint(
    request: FeatureRequest,
    rag_service: RAGIntegrationService = Depends(get_rag_service),
    context_builder: UserContextBuilder = Depends(get_user_context_builder),
    user: dict = Depends(verify_token),
):
    # 1. Get user context
    user_context = await context_builder.build_context(request.user_id)
    
    # 2. Get RAG context
    rag_context = rag_service.get_rag_context(
        endpoint="/api/feature",
        request_data=request.dict(),
        user_context=user_context,
        max_chunks=40,
        use_cache=True
    )
    
    # 3. Call service
    result = feature_service.process(request, user_context, rag_context)
    
    return FeatureResponse(**result)
```

### Pattern 2: RAG with Custom Caching

```python
from redis_client import get_cache_manager

@app.post("/api/feature")
async def feature_endpoint(...):
    cache = get_cache_manager()
    
    # Try cache first
    cache_key = f"feature_result:{request.user_id}:{request.param}"
    cached_result = cache.get(cache_key)
    
    if cached_result:
        return FeatureResponse(**cached_result)
    
    # Cache miss - compute with RAG
    rag_context = rag_service.get_rag_context(...)
    result = feature_service.process(request, user_context, rag_context)
    
    # Cache result
    cache.set(cache_key, result, ttl=1800)
    
    return FeatureResponse(**result)
```

### Pattern 3: Conditional RAG

```python
@app.post("/api/feature")
async def feature_endpoint(...):
    # Only use RAG for complex queries
    use_rag = request.complexity == "high"
    
    rag_context = None
    if use_rag:
        rag_context = rag_service.get_rag_context(...)
    
    result = feature_service.process(request, user_context, rag_context)
    return FeatureResponse(**result)
```

---

## Troubleshooting

### Rate Limiting Issues

#### Problem: 429 errors in development

**Solution:** Disable rate limiting
```bash
export ENABLE_RATE_LIMITING=false
```

#### Problem: Wrong tier detected

**Check:**
1. JWT token includes `user_metadata.tier`
2. Tier is one of: `free`, `premium`, `admin`
3. JWT secret matches `SUPABASE_JWT_SECRET`

**Debug:**
```python
# Print extracted tier in middleware
print(f"Detected tier: {tier}")
```

#### Problem: Rate limit not resetting

**Solution:** Reset manually
```python
from redis_client import get_rate_limiter

limiter = get_rate_limiter()
limiter.reset_rate_limit(user_id="user123", endpoint="/api/coach/ask")
```

### RAG Issues

#### Problem: Empty RAG context

**Check:**
1. Upstash Search credentials are correct
2. Namespaces exist and have data
3. Questionnaire transformer is working

**Debug:**
```python
# Check what transformer returns
questionnaire = rag_service._transform_by_endpoint(
    endpoint="/api/my-endpoint",
    request_data=request.dict(),
    user_context=user_context
)
print(f"Questionnaire: {questionnaire}")

# Check namespace selection
from smart_namespace_selector import SmartNamespaceSelector
selector = SmartNamespaceSelector()
namespaces = selector.select_namespaces(questionnaire)
print(f"Selected namespaces: {namespaces}")
```

#### Problem: RAG retrieval too slow

**Solutions:**
1. Reduce `max_chunks` (40 → 30)
2. Increase `cache_ttl` (1 hour → 4 hours)
3. Use `use_cache=True` (default)

#### Problem: Cache not working

**Check:**
1. Redis credentials are correct
2. Redis is accessible
3. Cache TTL is not 0

**Debug:**
```python
from redis_client import get_cache_manager

cache = get_cache_manager()

# Test cache
cache.set("test_key", "test_value", ttl=60)
value = cache.get("test_key")
print(f"Cache test: {value}")
```

### Service Integration Issues

#### Problem: Service doesn't accept `rag_context`

**Solution:** Update service method signature

**Before:**
```python
def process(self, request, user_context):
    ...
```

**After:**
```python
def process(self, request, user_context, rag_context=None):
    if rag_context:
        # Use RAG context in prompt
        prompt = f"{rag_context}\n\n{request.question}"
    else:
        # Fallback without RAG
        prompt = request.question
    ...
```

---

## Testing

### Rate Limiting Tests

```bash
cd apps/backend
pytest test_rate_limiting.py -v -s
```

### RAG Integration Tests

```python
def test_rag_context_retrieval():
    rag_service = get_rag_service()
    
    context = rag_service.get_rag_context(
        endpoint="/api/coach/ask",
        request_data={"question": "How do I increase bench press?"},
        user_context={},
        max_chunks=30
    )
    
    assert context is not None
    assert len(context) > 0
    assert "bench" in context.lower()
```

### Cache Tests

```python
def test_cache_hit():
    cache = get_cache_manager()
    
    # Set value
    cache.set("test_key", "test_value", ttl=60)
    
    # Get value
    value = cache.get("test_key")
    assert value == "test_value"
```

---

## Performance Tips

1. **Use caching** - Always use `use_cache=True` for RAG
2. **Tune chunk count** - Start with 40, reduce if too slow
3. **Cache user context** - Invalidate only when data changes
4. **Monitor cache hit rates** - Aim for >60% hit rate
5. **Use appropriate TTLs** - Longer for static data, shorter for dynamic

---

## Additional Resources

- **Detailed Implementation:** `docs/RAG_RATE_LIMITING_IMPLEMENTATION.md`
- **Implementation Summary:** `docs/IMPLEMENTATION_SUMMARY_JAN_2025.md`
- **SmartNamespaceSelector:** `smart_namespace_selector.py`
- **Rate Limit Middleware:** `rate_limit_middleware.py`
- **RAG Integration Service:** `rag_integration_service.py`

---

**Last Updated:** January 2025