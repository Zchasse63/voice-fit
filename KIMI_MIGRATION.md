# Kimi K2 Migration Guide

## Summary

Successfully migrated from Llama 3.3 70B (Nebius AI) to Kimi K2 Thinking (Moonshot AI) for all AI features in VoiceFit.

## What Changed

### Files Updated:
1. **apps/backend/chat_classifier.py** - Message classification
2. **apps/backend/ai_coach_service.py** - AI Coach with RAG
3. **apps/backend/integrated_voice_parser.py** - Voice parsing
4. **apps/backend/onboarding_service.py** - Onboarding extraction

### Key Changes:
- **Base URL**: `https://api.studio.nebius.ai/v1` → `https://api.moonshot.ai/v1`
- **Model**: `meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:voice-fit-original-UrGX` → `kimi-k2-thinking`
- **API Key**: `NEBIUS_API_KEY` → `KIMI_API_KEY`

## Railway Environment Variables

You need to update these environment variables in your Railway project:

### Required Changes:

```bash
# Remove these (old Nebius/Llama variables):
NEBIUS_API_KEY=<old_key>
NEBIUS_BASE_URL=https://api.studio.nebius.ai/v1
VOICE_MODEL_ID=meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:voice-fit-original-UrGX

# Add these (new Kimi variables):
KIMI_API_KEY=sk-jn62te1ZfJuQlaugMlT7wc95pCuDtJ7NOQK7wl3x0iQdYkvB
KIMI_BASE_URL=https://api.moonshot.ai/v1
KIMI_MODEL_ID=kimi-k2-thinking
```

### Keep These (unchanged):
```bash
UPSTASH_SEARCH_REST_URL=<your_url>
UPSTASH_SEARCH_REST_TOKEN=<your_token>
SUPABASE_URL=<your_url>
SUPABASE_SERVICE_KEY=<your_key>
XAI_API_KEY=<your_key>  # For Grok 4 Fast (program generation)
```

## How to Update Railway

1. Go to your Railway dashboard: https://railway.app
2. Select your `voice-fit-production` project
3. Click on the backend service
4. Go to **Variables** tab
5. **Remove** the old Nebius variables
6. **Add** the new Kimi variables (copy from above)
7. Click **Deploy** to restart with new variables

## Benefits of Kimi K2

1. **Faster**: Kimi K2 is very fast with low latency
2. **Smarter**: Trillion-parameter reasoning model
3. **More Personality**: Friendly, encouraging responses
4. **Cheaper**: $0.15/M input, $2.50/M output (vs Llama's pricing)
5. **OpenAI Compatible**: Drop-in replacement, easy to migrate

## Testing After Deployment

Once Railway redeploys (takes ~2-3 minutes), test these features:

1. **Chat Classification**: Send a message in the app → Should classify correctly
2. **Voice Parsing**: Log a workout set → Should parse correctly
3. **AI Coach**: Ask a question → Should get a response with personality
4. **Onboarding**: Start onboarding → Should extract data correctly

## Rollback Plan (if needed)

If something goes wrong, you can quickly rollback by:

1. Go to Railway Variables
2. Remove Kimi variables
3. Add back Nebius variables:
   ```bash
   NEBIUS_API_KEY=<your_old_key>
   NEBIUS_BASE_URL=https://api.studio.nebius.ai/v1
   VOICE_MODEL_ID=meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:voice-fit-original-UrGX
   ```
4. Redeploy

## Next Steps

After testing Kimi K2 in place of Llama, we can also test it for program generation (currently using Grok 4 Fast) if you want to consolidate to a single AI provider.

---

**Status**: ✅ Code changes complete, ready to deploy to Railway
**Action Required**: Update Railway environment variables and redeploy

