# Quick Test Commands - Enhanced Exercise Swap

**Use After Railway Deployment Completes**

---

## 1. Verify Railway Deployment

```bash
# Check deployment status
open https://railway.app/project/your-project-id

# Test health endpoint
curl https://your-railway-url.app/health

# Expected: {"status": "healthy"}
```

---

## 2. Test Backend API Directly

### Basic Swap (No Context)
```bash
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "exercise": "Barbell Back Squat",
    "user_id": "test-user-id"
  }' | jq
```

### With Injury Context
```bash
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "exercise": "Deadlift",
    "user_id": "test-user-id",
    "injuries": ["lower back pain"]
  }' | jq
```

### With Equipment Constraints
```bash
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "exercise": "Barbell Bench Press",
    "user_id": "test-user-id",
    "equipment_unavailable": ["barbell"]
  }' | jq
```

### With AI Re-Ranking (Premium)
```bash
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "exercise": "Pull-ups",
    "user_id": "test-user-id",
    "injuries": ["shoulder pain"],
    "use_ai_ranking": true
  }' | jq
```

---

## 3. Test Mobile Integration

### iOS
```bash
cd apps/mobile

# Install dependencies (if needed)
npm install
cd ios && pod install && cd ..

# Run on simulator
npm run ios

# Or specific simulator
npx react-native run-ios --simulator="iPhone 15 Pro"
```

### Android
```bash
cd apps/mobile

# Install dependencies (if needed)
npm install

# Run on emulator
npm run android
```

---

## 4. Quick Mobile Tests

Once app is running:

1. **Navigate to Example Screen**
   - Find and tap "Exercise Swap Example" in navigation

2. **Test Basic Swap**
   - Enter: "Barbell Back Squat"
   - Tap: "Get Substitutes"
   - ✅ Should show 5-10 results in < 300ms

3. **Test Injury Context**
   - Enter: "Deadlift"
   - Add injury: "lower back pain"
   - Tap: "Get Substitutes"
   - ✅ Should show red injury badge

4. **Test Cache**
   - Make same request twice
   - ✅ Second request should be instant (< 10ms)

5. **Check Cache Stats**
   - Tap: "Cache Stats"
   - ✅ Should show 1 item cached

---

## 5. Debug Commands

### Check TypeScript Compilation
```bash
cd apps/mobile
npx tsc --noEmit
# Should show no errors
```

### Check React Native Logs
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### Clear Metro Cache
```bash
cd apps/mobile
npm start -- --reset-cache
```

### Clear React Native Cache
```bash
cd apps/mobile
watchman watch-del-all
rm -rf node_modules
rm -rf ios/Pods
npm install
cd ios && pod install && cd ..
```

---

## 6. Get Auth Token (for API testing)

### Method 1: From Mobile App
```typescript
// In app console or temporary debug code
import { supabase } from './services/database/supabase.client';

const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session?.access_token);
```

### Method 2: From Supabase Dashboard
1. Go to Supabase Dashboard
2. Authentication → Users
3. Click on a user
4. Copy JWT token

---

## 7. Check Railway Logs

```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs --follow

# Filter for errors
railway logs | grep ERROR
```

---

## 8. Verify Environment Variables

### Railway (Backend)
```bash
railway variables

# Should include:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
# - UPSTASH_VECTOR_URL
# - UPSTASH_VECTOR_TOKEN
# - GROK_API_KEY
```

### Mobile (.env)
```bash
cat apps/mobile/.env

# Should have:
# API_BASE_URL=https://your-railway-url.app
```

---

## 9. Common Issues & Fixes

### Issue: "No active session"
```bash
# Fix: Ensure user is logged in
# Check Supabase session in app
```

### Issue: "Network error"
```bash
# Fix: Check API_BASE_URL in .env
cd apps/mobile
cat .env | grep API_BASE_URL
```

### Issue: Cache not working
```bash
# Fix: Clear AsyncStorage
# In app, tap "Clear Cache" button
# Or clear app data (Settings → App → Clear Data)
```

### Issue: TypeScript errors
```bash
cd apps/mobile
npm install
npx tsc --noEmit
```

### Issue: Metro bundler errors
```bash
cd apps/mobile
npm start -- --reset-cache
# Then in new terminal:
npm run ios  # or npm run android
```

---

## 10. Quick Performance Check

```bash
# Backend latency
time curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"exercise": "Squat", "user_id": "test"}' > /dev/null

# Should be < 0.5s total
```

---

## 11. Integration Test (Manual)

```bash
# 1. Test backend is responding
curl https://your-railway-url.app/health

# 2. Test enhanced endpoint
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"exercise": "Bench Press", "user_id": "test"}' | jq '.substitutes | length'

# Should return: 5-10

# 3. Run mobile app
cd apps/mobile && npm run ios

# 4. In app: Make a swap request
# 5. In app: Make same request again (test cache)
# 6. In app: Check cache stats
```

---

## 12. Feature Flag Verification

```bash
# Check if enhanced swap is enabled
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"exercise": "Squat", "user_id": "test"}' | \
  jq '.metadata.feature_flags'

# Should show:
# {
#   "enhanced_swap_enabled": true,
#   "ai_reranking_enabled": true
# }
```

---

## 13. Success Criteria Checklist

- [ ] Railway deployment shows "Active"
- [ ] Health endpoint returns 200 OK
- [ ] Basic swap returns 5-10 substitutes
- [ ] Swap with context filters correctly
- [ ] AI re-ranking works (if enabled)
- [ ] Mobile app builds without errors
- [ ] Example screen renders correctly
- [ ] First request completes in < 500ms
- [ ] Second request (cached) completes in < 10ms
- [ ] Cache stats show correct count
- [ ] No red screen errors on mobile

---

## 14. Next Steps After Success

1. ✅ Mark Phase 1 Day 3 complete
2. 🎯 Plan Phase 2 (chat integration)
3. 📊 Set up analytics tracking
4. 🧪 Write unit tests
5. 👥 Schedule user testing

---

**Quick Reference**: Keep this file open while testing!

**Need Help?**
- Backend docs: `apps/backend/ENHANCED_CONTEXT_AWARE_IMPLEMENTATION.md`
- Mobile docs: `apps/mobile/ENHANCED_SWAP_INTEGRATION.md`
- Full testing: `Zed/TESTING_CHECKLIST.md`
