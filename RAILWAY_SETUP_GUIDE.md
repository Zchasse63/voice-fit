# 🚂 Railway Deployment - Step-by-Step Fix Guide

## 🔴 Current Issues

1. ❌ **"No start command found"** - Railway can't find the start command
2. ❌ **"Error creating build plan with Railpack"** - Wrong root directory
3. ❌ **Missing environment variables** - Placeholder values instead of real API keys

---

## ✅ Solution: 3-Step Fix

### **Step 1: Configure Root Directory** ⏱️ 1 minute

Railway needs to know your backend is in `apps/backend/`, not the root.

1. In Railway dashboard, click on your service
2. Go to **Settings** tab
3. Scroll to **Service Settings**
4. Find **Root Directory** setting
5. Set it to: `apps/backend`
6. Click **Save**

**Why?** Railway is looking for `main.py` in the root, but it's actually in `apps/backend/main.py`.

---

### **Step 2: Add Environment Variables** ⏱️ 5 minutes

Railway doesn't read your local `.env` file. You need to manually add each variable.

1. In Railway dashboard, go to **Variables** tab
2. Click **+ New Variable** for each one below
3. Copy the **exact values** from below (these are your real API keys from `.env`)

#### **Required Variables:**

**⚠️ IMPORTANT:** Copy these values from your local `.env` file (located at the root of your project).

**DO NOT use the placeholder values** - Railway needs the **actual API keys** from your `.env` file.

```bash
# Supabase Configuration (from .env lines 2-8)
SUPABASE_URL=<copy from .env line 2>
SUPABASE_KEY=<copy from .env line 3>
SUPABASE_SERVICE_KEY=<copy from .env line 4>
SUPABASE_JWT_SECRET=<copy from .env line 5>
SUPABASE_PROJECT_ID=<copy from .env line 6>
SUPABASE_REGION=<copy from .env line 7>

# AI APIs (from .env lines 10-12, 20, 1)
NEBIUS_API_KEY=<copy from .env line 10>
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1
VOICE_MODEL_ID=<copy from .env line 12>
XAI_API_KEY=<copy from .env line 20>
OPENAI_API_KEY=<copy from .env line 1>

# Upstash Search (from .env lines 16-17)
UPSTASH_SEARCH_REST_URL=<copy from .env line 16>
UPSTASH_SEARCH_REST_TOKEN=<copy from .env line 17>

# Weather API (from .env lines 24-25)
WEATHER_API_KEY=<copy from .env line 24>
WEATHER_API_PROVIDER=openweathermap

# Authentication (from .env line 23)
REQUIRE_AUTH=true

# Optional (for logging)
LOG_LEVEL=info
DRY_RUN=false
MIGRATION_BATCH_SIZE=100
EMBEDDING_COMMIT_INTERVAL=100
EMBEDDING_BATCH_SIZE=50
TIMEOUT_MS=30000
```

**💡 TIP:** Open your `.env` file in a text editor and copy each value directly to avoid typos.

#### **Variables You Already Have (Keep These):**

These are already in your Railway dashboard - just verify they match:

- ✅ `NEBIUS_BASE_URL` = `https://api.tokenfactory.nebius.com/v1`
- ✅ `SUPABASE_PROJECT_ID` = `szragdskusayriycfhrs`
- ✅ `UPSTASH_SEARCH_REST_TOKEN` = (your token)
- ✅ `LOG_LEVEL` = `info`
- ✅ `DRY_RUN` = `false`

#### **Variables to UPDATE (Replace Placeholders):**

These currently have placeholder values like `"your-supabase-service-role-key-here"`. Replace them with the real values above:

1. **SUPABASE_SERVICE_KEY** - Replace `your-supabase-service-role-key-here` with real key
2. **SUPABASE_KEY** - Replace `your-supabase-anon-key-here` with real key
3. **WEATHER_API_KEY** - Replace `your-openweathermap-api-key-here` with `73f2b83868beddbd6d47a01720ac5bb7`
4. **XAI_API_KEY** - Replace `xai-your-xai-api-key-here` with real key
5. **OPENAI_API_KEY** - Replace `sk-proj-your-openai-api-key-here` with real key
6. **SUPABASE_JWT_SECRET** - Replace `your-supabase-jwt-secret-here` with real secret

---

### **Step 3: Redeploy** ⏱️ 2 minutes

After setting the root directory and adding all environment variables:

1. Go to **Deployments** tab
2. Click **Deploy** button (top right)
3. Wait 2-3 minutes for build to complete
4. Check logs for success message

---

## 🎯 Quick Checklist

Before redeploying, verify:

- [ ] Root Directory set to `apps/backend`
- [ ] All 20+ environment variables added (no placeholders)
- [ ] `REQUIRE_AUTH=true` (for production)
- [ ] `SUPABASE_SERVICE_KEY` is the **service role key** (not anon key)
- [ ] `XAI_API_KEY` starts with `xai-`
- [ ] `OPENAI_API_KEY` starts with `sk-proj-`
- [ ] `WEATHER_API_KEY` is the actual key (not placeholder)

---

## 🔍 How to Verify Success

After deployment completes:

### **1. Check Deployment Logs**

Look for these success messages:
```
✅ Build completed successfully
✅ Starting uvicorn server
✅ Application startup complete
✅ Uvicorn running on http://0.0.0.0:$PORT
```

### **2. Test Health Endpoint**

Railway will give you a URL like: `https://your-app.up.railway.app`

Test it:
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "VoiceFit API",
  "version": "1.0.0",
  "supabase_connected": true
}
```

### **3. Update Mobile App**

Once Railway gives you the production URL:

1. Open `apps/mobile/.env`
2. Update:
   ```bash
   EXPO_PUBLIC_VOICE_API_URL=https://your-app.up.railway.app
   ```
3. Commit and push

---

## ❌ Common Errors & Fixes

### **Error: "No start command found"**
**Fix:** Set Root Directory to `apps/backend` in Railway Settings

### **Error: "Error creating build plan with Railpack"**
**Fix:** Set Root Directory to `apps/backend` in Railway Settings

### **Error: "ModuleNotFoundError: No module named 'fastapi'"**
**Fix:** Railway is finding `requirements.txt`. Root directory is correct.

### **Error: "SUPABASE_SERVICE_KEY not found"**
**Fix:** Add the environment variable with the real value (not placeholder)

### **Error: "Invalid JWT secret"**
**Fix:** Make sure `SUPABASE_JWT_SECRET` is the exact value from `.env`

---

## 🚀 After Successful Deployment

1. ✅ Copy the Railway production URL
2. ✅ Update `apps/mobile/.env` with production URL
3. ✅ Test the `/health` endpoint
4. ✅ Test a voice parsing request
5. ✅ Move on to TestFlight build

---

## 📞 Need Help?

If you're still seeing errors after following these steps:

1. Share the **full deployment logs** from Railway
2. Share a screenshot of your **Variables** tab
3. Share a screenshot of your **Settings** tab (showing Root Directory)

---

**Ready to fix Railway?** Follow Steps 1-3 above! 🚂

