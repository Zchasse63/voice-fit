# Enhanced Exercise Swap - Testing & Deployment Checklist

**Date**: November 15, 2024  
**Phase**: Day 3 - Mobile Integration Testing  
**Status**: 🟡 Awaiting Railway Deployment

---

## Pre-Testing Setup

### ☐ Backend Deployment (Railway)
- [ ] Railway build completed successfully
- [ ] Deployment shows "Active" status
- [ ] No errors in Railway logs
- [ ] Health check endpoint responds: `GET /health`
- [ ] API docs accessible: `GET /docs`

### ☐ Environment Configuration
- [ ] Mobile `.env` file has correct `API_BASE_URL`
- [ ] Backend environment variables set correctly
- [ ] Feature flags configured in Railway
- [ ] Database migrations applied
- [ ] Upstash RAG credentials active

### ☐ Dependencies Verified
- [ ] `@react-native-async-storage/async-storage` installed
- [ ] `@supabase/supabase-js` installed
- [ ] `react-native-safe-area-context` installed
- [ ] All imports resolve without errors
- [ ] TypeScript compiles without errors

---

## Backend API Testing

### ☐ Test Enhanced Endpoint Directly

**Endpoint**: `POST /api/chat/swap-exercise-enhanced`

```bash
# Test 1: Basic swap (no context)
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "exercise": "Barbell Back Squat",
    "user_id": "test-user-id"
  }'

# Expected: 200 OK, 5-10 substitutes, processing_time_ms < 300
```

```bash
# Test 2: With injury context
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "exercise": "Deadlift",
    "user_id": "test-user-id",
    "injuries": ["lower back pain"]
  }'

# Expected: Substitutes avoid lower back, injuries_considered populated
```

```bash
# Test 3: With AI re-ranking
curl -X POST https://your-railway-url.app/api/chat/swap-exercise-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "exercise": "Bench Press",
    "user_id": "test-user-id",
    "use_ai_ranking": true
  }'

# Expected: ai_reranked = true, reasoning field populated
```

### ☐ Verify Response Structure
- [ ] `original_exercise` present
- [ ] `substitutes` array not empty
- [ ] Each substitute has `exercise`, `similarity_score`, `reasoning`
- [ ] `context_applied` object present
- [ ] `metadata` includes `processing_time_ms`, `ai_reranked`, `feature_flags`

### ☐ Test Feature Flags
- [ ] Enhanced swap enabled: Check `metadata.feature_flags.enhanced_swap_enabled`
- [ ] AI re-ranking available: Check `metadata.feature_flags.ai_reranking_enabled`

---

## Mobile Build & Run

### ☐ iOS Setup
```bash
cd apps/mobile
npm install
cd ios && pod install && cd ..
npm run ios
```
- [ ] Build completes without errors
- [ ] App launches successfully
- [ ] No red screen errors
- [ ] Console shows no critical warnings

### ☐ Android Setup
```bash
cd apps/mobile
npm install
npm run android
```
- [ ] Build completes without errors
- [ ] App launches successfully
- [ ] No red screen errors
- [ ] Console shows no critical warnings

---

## Mobile Integration Tests

### ☐ Navigate to Example Screen
- [ ] Can navigate to `ExerciseSwapExample` screen
- [ ] All UI elements render correctly
- [ ] Form inputs are functional
- [ ] Buttons are tappable

---

## Functional Test Cases

### Test 1: Basic Swap (No Context)

**Input**:
- Exercise: "Barbell Back Squat"
- Injuries: (none)
- Equipment Unavailable: (none)
- AI Ranking: OFF

**Steps**:
1. Enter "Barbell Back Squat" in exercise field
2. Tap "Get Substitutes"
3. Wait for results

**Expected Results**:
- [ ] Loading indicator shows
- [ ] Loading completes in < 300ms
- [ ] 5-10 substitutes appear
- [ ] Each shows match percentage (e.g., "87%")
- [ ] No context badges displayed
- [ ] Can tap substitute to expand details
- [ ] Details show muscle groups and equipment

**Actual Results**: _______________

---

### Test 2: Injury Context Filtering

**Input**:
- Exercise: "Deadlift"
- Injuries: "lower back pain"
- Equipment Unavailable: (none)
- AI Ranking: OFF

**Steps**:
1. Enter "Deadlift"
2. Add "lower back pain" to injuries
3. Tap "Get Substitutes"

**Expected Results**:
- [ ] Loading completes successfully
- [ ] Red injury badge appears: "1 injury filter"
- [ ] Substitutes avoid lower back exercises
- [ ] Badge shows "lower back pain" on tap
- [ ] Results filtered appropriately (RDLs, conventional DL excluded)

**Actual Results**: _______________

---

### Test 3: Equipment Constraints

**Input**:
- Exercise: "Barbell Bench Press"
- Injuries: (none)
- Equipment Unavailable: "barbell"
- AI Ranking: OFF

**Steps**:
1. Enter "Barbell Bench Press"
2. Add "barbell" to equipment unavailable
3. Tap "Get Substitutes"

**Expected Results**:
- [ ] Loading completes successfully
- [ ] Teal equipment badge appears: "Avoiding 1 equipment"
- [ ] No barbell exercises in results
- [ ] Only dumbbell/bodyweight alternatives shown
- [ ] Badge shows "barbell" on tap

**Actual Results**: _______________

---

### Test 4: AI Re-Ranking (Premium)

**Input**:
- Exercise: "Pull-ups"
- Injuries: "shoulder pain"
- Equipment Unavailable: (none)
- AI Ranking: ON

**Steps**:
1. Enter "Pull-ups"
2. Add "shoulder pain" to injuries
3. Check "Use AI Re-ranking"
4. Tap "Get Substitutes"

**Expected Results**:
- [ ] Loading completes (300-500ms is acceptable)
- [ ] Purple "🤖 AI Re-ranked" badge appears
- [ ] AI reasoning section appears (collapsed by default)
- [ ] Can tap to expand AI reasoning
- [ ] Natural language explanation visible
- [ ] Debug mode shows `ai_reranked: true`

**Actual Results**: _______________

---

### Test 5: Cache Behavior

**Steps**:
1. Make request: "Bench Press", injuries: ["shoulder"]
2. Note processing time (e.g., 250ms)
3. Tap "Get Substitutes" again (same inputs)
4. Note processing time
5. Tap "Cache Stats"

**Expected Results - First Request**:
- [ ] Normal processing time (200-400ms)
- [ ] Results appear
- [ ] No "cached" indicator in console

**Expected Results - Second Request**:
- [ ] Near-instant response (< 10ms)
- [ ] Identical results
- [ ] Console log: "✅ Returning cached swap result"

**Expected Results - Cache Stats**:
- [ ] Shows "1" cached item
- [ ] Shows age (e.g., "0.0 hours")

**Steps (continued)**:
6. Change injuries to ["elbow"]
7. Tap "Get Substitutes"
8. Tap "Cache Stats"

**Expected Results - Different Context**:
- [ ] Normal processing time (new API call)
- [ ] Different results
- [ ] Cache stats now shows "2" items

**Actual Results**: _______________

---

### Test 6: Cache Management

**Steps**:
1. Make 2-3 different swap requests
2. Tap "Cache Stats" → note count
3. Tap "Clear Cache"
4. Tap "Cache Stats" again

**Expected Results**:
- [ ] Cache stats shows correct count before clear
- [ ] Console log: "🗑️ Cleared X cached swaps"
- [ ] Cache stats shows "0" after clear
- [ ] Next request is not cached (normal timing)

**Actual Results**: _______________

---

### Test 7: Error Handling

**Steps**:
1. Turn off WiFi/cellular
2. Enter any exercise
3. Tap "Get Substitutes"

**Expected Results**:
- [ ] Loading indicator shows
- [ ] Error message appears (not crash)
- [ ] Error text: "Network error" or similar
- [ ] Can dismiss error
- [ ] Can retry when network restored

**Actual Results**: _______________

---

### Test 8: Legacy Fallback

**Steps**:
1. Enter "Squat"
2. Tap "Legacy Mode" button

**Expected Results**:
- [ ] Request completes successfully
- [ ] Simple list of substitutes shown
- [ ] No context badges (or minimal badges)
- [ ] Debug shows `ai_reranked: false`
- [ ] Results displayed in same card format

**Actual Results**: _______________

---

### Test 9: Substitute Selection

**Steps**:
1. Make any swap request
2. Tap on a substitute card
3. Review alert dialog

**Expected Results**:
- [ ] Alert appears with substitute name
- [ ] Shows match percentage
- [ ] Shows reasoning text
- [ ] "OK" and "Use This" buttons appear
- [ ] Tapping "Use This" logs to console

**Actual Results**: _______________

---

### Test 10: UI/UX Polish

**Check**:
- [ ] Badges scroll horizontally if too many
- [ ] Cards have proper shadows/elevation
- [ ] Expand/collapse animation smooth
- [ ] Text is readable on all screen sizes
- [ ] No text overflow or truncation issues
- [ ] Difficulty badges show correct colors:
  - Beginner: Green
  - Intermediate: Orange/Yellow
  - Advanced: Red
- [ ] Loading spinner centered and visible
- [ ] Keyboard doesn't obscure inputs
- [ ] Safe area insets respected (notch, home indicator)

**Actual Results**: _______________

---

## Performance Tests

### ☐ Latency Measurements

| Scenario | Target | Measured | Pass/Fail |
|----------|--------|----------|-----------|
| Cache hit | < 10ms | _____ms | ☐ |
| Basic swap (no context) | 100-200ms | _____ms | ☐ |
| Swap with injuries | 200-300ms | _____ms | ☐ |
| Swap with AI ranking | 300-500ms | _____ms | ☐ |

### ☐ Memory & Stability
- [ ] No memory leaks after 10 swaps
- [ ] App doesn't crash under load
- [ ] Cache doesn't grow indefinitely
- [ ] UI remains responsive during requests

---

## Debug Mode Verification

### ☐ Enable Debug Mode
- [ ] Check "Show Debug Info" in example screen
- [ ] Debug info box appears in card

### ☐ Verify Debug Info Shows
- [ ] DB Results count
- [ ] RAG Results count
- [ ] Processing time (ms)
- [ ] AI Reranked: Yes/No
- [ ] Enhanced Swap: On/Off
- [ ] AI Reranking: On/Off (feature flags)

---

## Integration Points (TODO - Phase 2)

### ☐ Chat Interface
- [ ] Add swap button/command to chat
- [ ] Handle voice input "swap exercise"
- [ ] Display results inline in chat
- [ ] Allow selection from chat

### ☐ Workout Logging
- [ ] Substitute selection updates workout
- [ ] Original exercise logged with reason
- [ ] New exercise becomes active
- [ ] History shows swap occurred

### ☐ Context Auto-Population
- [ ] Injuries auto-fetched from injury store
- [ ] Equipment prefs auto-loaded
- [ ] Program context auto-detected
- [ ] User preferences applied

---

## Regression Tests

### ☐ Existing Features Still Work
- [ ] Normal workout logging unaffected
- [ ] Chat functionality intact
- [ ] Auth flow works
- [ ] Other API calls successful

---

## Analytics Verification (Future)

### ☐ Events to Track
- [ ] Swap request initiated
- [ ] Swap request completed
- [ ] Substitute selected
- [ ] AI re-ranking used
- [ ] Cache hit/miss rate
- [ ] Error rate

---

## Production Readiness Checklist

### ☐ Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical)
- [ ] All console.logs reviewed (remove or gate)
- [ ] Error boundaries in place
- [ ] Proper error messages to users

### ☐ Performance
- [ ] All latency targets met
- [ ] No UI freezing
- [ ] Cache working correctly
- [ ] Memory usage acceptable

### ☐ User Experience
- [ ] UI polished and intuitive
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Success feedback clear

### ☐ Security
- [ ] Auth tokens handled securely
- [ ] No sensitive data logged
- [ ] API calls use HTTPS
- [ ] User data not exposed

---

## Sign-Off

### Development Testing
- [ ] All functional tests pass
- [ ] All performance tests pass
- [ ] No critical bugs found
- [ ] Documentation accurate

**Tested By**: _______________  
**Date**: _______________  
**Notes**: _______________

### QA Testing (Phase 2)
- [ ] Independent QA pass
- [ ] Edge cases tested
- [ ] Multi-device testing complete
- [ ] Accessibility reviewed

**Tested By**: _______________  
**Date**: _______________  
**Notes**: _______________

### Stakeholder Approval (Phase 2)
- [ ] Demo completed
- [ ] Feedback incorporated
- [ ] Approved for production

**Approved By**: _______________  
**Date**: _______________  

---

## Issues Found

### Issue #1
**Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low  
**Description**: _______________  
**Steps to Reproduce**: _______________  
**Expected**: _______________  
**Actual**: _______________  
**Status**: ☐ Open ☐ In Progress ☐ Resolved  

### Issue #2
**Severity**: ☐ Critical ☐ High ☐ Medium ☐ Low  
**Description**: _______________  
**Steps to Reproduce**: _______________  
**Expected**: _______________  
**Actual**: _______________  
**Status**: ☐ Open ☐ In Progress ☐ Resolved  

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Merge to main branch
2. Deploy to staging environment
3. Conduct user acceptance testing
4. Plan Phase 2 features
5. Schedule production release

### If Critical Issues Found ❌
1. Document all issues
2. Prioritize fixes
3. Create fix branches
4. Re-test after fixes
5. Re-run full test suite

---

**Testing Complete**: ☐ Yes ☐ No ☐ Partial  
**Ready for Phase 2**: ☐ Yes ☐ No  
**Production Ready**: ☐ Yes ☐ No