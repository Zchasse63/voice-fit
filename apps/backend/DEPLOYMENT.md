# VoiceFit Backend Deployment Guide

## 🚀 Railway.app Deployment

This guide walks you through deploying the VoiceFit FastAPI backend to Railway.app.

---

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- VoiceFit repository pushed to GitHub
- All API keys ready (Supabase, Nebius, OpenAI, xAI, Upstash, Weather)

---

## Step 1: Create Railway Account (2 minutes)

1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. You'll be redirected to Railway dashboard

---

## Step 2: Create New Project (3 minutes)

1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Choose `Zchasse63/voice-fit` repository
4. Railway will auto-detect the Python app

**Important:** Set the root directory to `apps/backend`

---

## Step 3: Configure Build Settings (2 minutes)

Railway should auto-detect Python, but verify:

### Build Configuration:
- **Builder:** Nixpacks (auto-detected)
- **Root Directory:** `apps/backend`
- **Build Command:** `pip install -r requirements.txt` (auto-detected)
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Python Version:
- **Runtime:** Python 3.11 (specified in `runtime.txt`)

---

## Step 4: Configure Environment Variables (5 minutes)

In Railway dashboard → Your Project → Variables tab, add these:

### Supabase Configuration
```bash
SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

### AI Services
```bash
# Nebius (Llama 3.3 70B)
NEBIUS_API_KEY=your-nebius-key-here
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1
VOICE_MODEL_ID=meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:voice-fit-original-UrGX

# xAI (Grok 4 Fast)
XAI_API_KEY=your-xai-key-here

# OpenAI (Embeddings)
OPENAI_API_KEY=your-openai-key-here
```

### Upstash Search
```bash
UPSTASH_SEARCH_REST_URL=your-upstash-url-here
UPSTASH_SEARCH_REST_TOKEN=your-upstash-token-here
```

### Weather API
```bash
WEATHER_API_KEY=your-weather-key-here
WEATHER_API_PROVIDER=openweathermap
```

### Authentication & CORS
```bash
# Enable authentication in production
REQUIRE_AUTH=true

# Allow all origins for mobile app (mobile apps don't send Origin headers)
ALLOWED_ORIGINS=*
```

---

## Step 5: Deploy (2 minutes)

1. Click "Deploy" button
2. Railway will:
   - Clone your repository
   - Install dependencies from `requirements.txt`
   - Start the FastAPI server
   - Assign a public URL

3. Wait 2-3 minutes for build to complete

4. You'll see deployment logs in real-time

---

## Step 6: Get Your Production URL (1 minute)

After deployment succeeds:

1. Go to Settings → Domains
2. Railway provides a URL like: `https://voicefit-production.up.railway.app`
3. Copy this URL - you'll need it for the mobile app

---

## Step 7: Verify Deployment (2 minutes)

### Test Health Check:
```bash
curl https://your-railway-url.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:00:00Z"
}
```

### Test API Docs:
Open in browser:
```
https://your-railway-url.up.railway.app/docs
```

You should see the FastAPI Swagger UI with all endpoints.

### Test Voice Parse Endpoint:
```bash
curl -X POST https://your-railway-url.up.railway.app/api/voice/parse \
  -H "Content-Type: application/json" \
  -d '{
    "voice_command": "bench press 225 for 5",
    "user_id": "test-user"
  }'
```

Expected response:
```json
{
  "success": true,
  "exercise_name": "Bench Press",
  "weight": 225,
  "reps": 5,
  ...
}
```

---

## Step 8: Update Mobile App (2 minutes)

Update `apps/mobile/.env`:

```bash
# Replace localhost with your Railway URL
EXPO_PUBLIC_VOICE_API_URL=https://your-railway-url.up.railway.app

# Keep Supabase config
EXPO_PUBLIC_SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 9: Test Mobile App with Production Backend (5 minutes)

1. Restart Expo development server:
   ```bash
   cd apps/mobile
   npm start
   ```

2. Open app in iOS Simulator

3. Test voice parsing:
   - Go to Chat screen
   - Say "bench press 225 for 5"
   - Verify it parses correctly

4. Test AI Coach:
   - Ask "What's the best way to increase my bench press?"
   - Verify you get a response

5. Check Railway logs:
   - Go to Railway dashboard → Deployments → Logs
   - You should see API requests coming in

---

## Troubleshooting

### Build Fails

**Error:** `Could not find a version that satisfies the requirement...`

**Solution:** Check `requirements.txt` for invalid package versions. Remove any local file paths.

---

### App Crashes on Start

**Error:** `Application failed to respond`

**Solution:** Check Railway logs for errors. Common issues:
- Missing environment variables
- Invalid API keys
- Port binding issues (make sure using `$PORT`)

---

### CORS Errors from Mobile App

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:** Verify `ALLOWED_ORIGINS=*` in Railway environment variables.

---

### Timeout Errors

**Error:** `Request timeout after 30 seconds`

**Solution:** 
- Check if AI API keys are valid (Nebius, OpenAI, xAI)
- Verify Upstash Search is configured correctly
- Check Railway logs for slow queries

---

## Monitoring & Logs

### View Real-Time Logs:
1. Go to Railway dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click "View Logs"

### Monitor Resource Usage:
1. Go to "Metrics" tab
2. View CPU, Memory, Network usage
3. Set up alerts for high usage

---

## Scaling

### Current Plan (Hobby - $5/month):
- Good for TestFlight (10-50 users)
- 512MB RAM
- 1 vCPU
- 500GB bandwidth

### When to Upgrade to Pro ($20/month):
- 100+ active users
- Need more than 512MB RAM
- Need faster response times
- Want priority support

---

## Cost Estimate

### TestFlight Phase (1-3 months):
- **Hobby Plan:** $5/month
- **Compute:** ~$5-10/month
- **Total:** **$10-15/month**

### Production (100-1000 users):
- **Pro Plan:** $20/month
- **Compute:** ~$20-40/month
- **Total:** **$40-60/month**

---

## Security Checklist

Before going to production:

- [ ] All API keys stored in Railway environment variables (NOT in code)
- [ ] `.env` file added to `.gitignore`
- [ ] `REQUIRE_AUTH=true` enabled
- [ ] HTTPS enabled (automatic with Railway)
- [ ] Supabase RLS policies enabled
- [ ] Rate limiting configured (future enhancement)

---

## Next Steps

After successful deployment:

1. ✅ Update mobile app `.env` with production URL
2. ✅ Test all API endpoints from mobile app
3. ✅ Build iOS app with `eas build`
4. ✅ Submit to TestFlight
5. ✅ Invite test users
6. ✅ Monitor Railway logs for errors
7. ✅ Set up error tracking (Sentry - future enhancement)

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **FastAPI Docs:** https://fastapi.tiangolo.com

---

## Rollback

If deployment fails and you need to rollback:

1. Go to Railway dashboard → Deployments
2. Find previous successful deployment
3. Click "Redeploy"
4. Railway will rollback to that version

---

**Deployment complete!** 🎉

Your VoiceFit backend is now live and ready for TestFlight testing!

