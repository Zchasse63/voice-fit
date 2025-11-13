# VoiceFit Backend Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables ✅
- [ ] `KIMI_VOICE_MODEL_ID=kimi-k2-turbo-preview` (updated from kimi-k2-thinking-turbo)
- [ ] `XAI_API_KEY` is set
- [ ] `UPSTASH_SEARCH_REST_URL` is set
- [ ] `UPSTASH_SEARCH_REST_TOKEN` is set
- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_KEY` is set
- [ ] `JWT_SECRET` is set

### 2. Code Changes ✅
- [x] `integrated_voice_parser.py` - Updated to Kimi K2 Turbo Preview + RAG
- [x] `chat_classifier.py` - Migrated to Grok 4 Fast Reasoning
- [x] `ai_coach_service.py` - Migrated to Grok 4 Fast Reasoning
- [x] `program_generation_service.py` - Added explicit JSON schema

### 3. Dependencies
- [ ] All Python dependencies installed (`pip install -r requirements.txt`)
- [ ] No new dependencies added (all changes use existing libraries)

## Railway Deployment Steps

### Step 1: Update Environment Variables in Railway

1. Go to Railway dashboard: https://railway.app
2. Select your VoiceFit backend service
3. Click "Variables" tab
4. Update/add these variables:

```bash
KIMI_VOICE_MODEL_ID=kimi-k2-turbo-preview
XAI_API_KEY=<your_xai_api_key>
```

5. Click "Deploy" to apply changes

### Step 2: Deploy Code Changes

Option A: **Git Push (Recommended)**
```bash
cd /Users/zach/Desktop/VoiceFit
git add apps/backend/
git commit -m "Implement final AI architecture: Kimi K2 Turbo for voice parsing + RAG, Grok 4 Fast for all reasoning tasks"
git push origin main
```

Railway will automatically detect the push and deploy.

Option B: **Railway CLI**
```bash
railway up
```

### Step 3: Monitor Deployment

1. Watch Railway logs for any errors
2. Look for these startup messages:
   ```
   ✅ Supabase connected
   ✅ Voice parser initialized
   ✅ Model: kimi-k2-turbo-preview
   ✅ Voice Fit API ready!
   ```

### Step 4: Test Endpoints

#### Test Voice Parsing (should be ~1.5s)
```bash
curl -X POST https://your-railway-url.up.railway.app/api/voice/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "transcript": "Bench press 225 for 8 reps RPE 8",
    "user_id": "test_user",
    "auto_save": false
  }'
```

Expected response:
```json
{
  "exercise_name": "Bench Press",
  "weight": 225,
  "reps": 8,
  "rpe": 8,
  "confidence": 0.95,
  "latency_ms": 1500
}
```

#### Test Chat Classification (should be ~1.3s)
```bash
curl -X POST https://your-railway-url.up.railway.app/api/chat/classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "How do I improve my squat depth?",
    "user_id": "test_user"
  }'
```

Expected response:
```json
{
  "message_type": "question",
  "confidence": 0.95,
  "reasoning": "User is asking for fitness advice",
  "suggested_action": "call_ai_coach"
}
```

#### Test AI Coach (should be ~7-8s total, ~2s TTFT)
```bash
curl -X POST https://your-railway-url.up.railway.app/api/coach/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "question": "How do I break through a bench press plateau?",
    "user_id": "test_user"
  }'
```

Expected response:
```json
{
  "answer": "To break through a bench press plateau...",
  "confidence": 0.9,
  "sources": [...],
  "latency_ms": 7600,
  "perceived_latency_ms": 2100
}
```

## Post-Deployment Verification

### 1. Performance Metrics
- [ ] Voice parsing latency: ~1.5s (down from ~4.5s)
- [ ] Chat classification latency: ~1.3s
- [ ] AI Coach latency: ~7-8s total, ~2s TTFT
- [ ] Program generation latency: ~45-60s (down from ~255s)

### 2. Quality Checks
- [ ] Voice parsing: 100% accuracy on test cases
- [ ] Chat classification: Correct classification on test messages
- [ ] AI Coach: Relevant, detailed answers with sources
- [ ] Program generation: Complete 12-week programs with proper JSON structure

### 3. Cost Monitoring
- [ ] Monitor xAI API usage (should be ~$0.11 per user per month)
- [ ] Monitor Kimi API usage (should be ~$0.01 per user per month)
- [ ] Total AI cost: ~$0.12 per user per month

## Rollback Plan

If issues occur, rollback by:

1. **Revert environment variables in Railway:**
   ```bash
   KIMI_VOICE_MODEL_ID=kimi-k2-thinking-turbo
   ```

2. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Or use Railway's rollback feature:**
   - Go to Railway dashboard
   - Click "Deployments"
   - Click "Rollback" on previous deployment

## Success Criteria

✅ All endpoints responding correctly
✅ Latency improvements verified
✅ No increase in error rates
✅ Cost reduction confirmed
✅ Quality maintained or improved

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch logs and metrics
2. **Gather user feedback** - Are responses better? Faster?
3. **Implement Personality System** - See `PERSONALITY_SYSTEM_DESIGN.md`
4. **Optimize further** - Fine-tune prompts based on production data


