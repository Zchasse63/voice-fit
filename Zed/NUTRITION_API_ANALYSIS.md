# Nutrition API Integration Analysis for VoiceFit

**Date:** 2025-01-24  
**Purpose:** Evaluate nutrition data integration options  
**Status:** Research & Analysis

---

## Executive Summary

**TL;DR:** The best approach is to use **Apple Health/HealthKit as the primary integration** with a fallback to **Terra API** for users who need multi-platform support (Cronometer, MyFitnessPal, etc.).

**Key Findings:**
1. ✅ Apple Health/HealthKit natively supports nutrition data (calories, macros, micros)
2. ❌ MyFitnessPal API is private (invite-only, not publicly available)
3. ❌ Cronometer has no direct public API
4. ✅ Terra API aggregates 15+ nutrition apps (including MFP, Cronometer) but costs $49-199/month
5. ✅ Many nutrition apps (MacroFactor, Foodnoms, SnapCalorie) export to Apple Health

**Recommended Strategy:**
- **Phase 1:** Apple Health/HealthKit integration (free, 80% coverage)
- **Phase 2:** Terra API for premium users (multi-platform support)
- **Phase 3:** Manual entry fallback for Android/web users

---

## Option 1: Apple Health / HealthKit (RECOMMENDED)

### What It Supports

Apple Health can store and retrieve:
- ✅ **Calories** (dietary energy consumed)
- ✅ **Macros**: Protein, carbs, fat, fiber, sugar
- ✅ **Micros**: 30+ nutrients (vitamins, minerals, cholesterol, sodium, etc.)
- ✅ **Water intake**
- ✅ **Caffeine**
- ✅ **Meal timestamps**

### HealthKit Nutrition Data Types

```swift
// Available nutrition types in HealthKit
HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed) // Calories
HKQuantityType.quantityType(forIdentifier: .dietaryProtein)
HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates)
HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal)
HKQuantityType.quantityType(forIdentifier: .dietaryFiber)
HKQuantityType.quantityType(forIdentifier: .dietarySugar)
HKQuantityType.quantityType(forIdentifier: .dietaryWater)
HKQuantityType.quantityType(forIdentifier: .dietaryCaffeine)
HKQuantityType.quantityType(forIdentifier: .dietarySodium)
HKQuantityType.quantityType(forIdentifier: .dietaryCalcium)
// ... 30+ more micronutrients
```

### How It Works

1. **User logs food in any nutrition app** (MyFitnessPal, Cronometer, MacroFactor, Foodnoms, etc.)
2. **App exports data to Apple Health** (most modern nutrition apps support this)
3. **VoiceFit reads from Apple Health** (with user permission)
4. **Data is automatically synced** (no manual API calls, no rate limits)

### Apps That Export to Apple Health

**Major Apps (Confirmed):**
- ✅ MyFitnessPal (exports calories, macros, water)
- ✅ Cronometer (exports full nutrition data)
- ✅ MacroFactor (exports calories, macros, micros)
- ✅ Foodnoms (exports full nutrition data)
- ✅ SnapCalorie (AI-powered photo calorie counter)
- ✅ LoseIt! (exports calories, macros)
- ✅ Yazio (exports nutrition data)
- ✅ Lifesum (exports nutrition data)

### Pros
- ✅ **Free** (no API costs)
- ✅ **Native iOS integration** (no external dependencies)
- ✅ **Works with 15+ nutrition apps** (user's choice of tracker)
- ✅ **Real-time sync** (no polling required)
- ✅ **Privacy-first** (data stays on device, user controls access)
- ✅ **No rate limits** (unlike third-party APIs)
- ✅ **Full nutrition data** (macros + micros)

### Cons
- ❌ **iOS only** (no Android equivalent via Google Fit)
- ❌ **Requires user to grant permission** (some friction)
- ❌ **Data quality depends on source app** (garbage in, garbage out)
- ❌ **No meal-level detail** (only daily totals available via HealthKit)

### Implementation Effort
⏱️ **1-2 weeks** for basic implementation

```typescript
// React Native implementation (using react-native-health)
import AppleHealthKit from 'react-native-health';

async function getNutritionData(date: Date) {
  const options = {
    startDate: date.toISOString(),
    endDate: date.toISOString(),
  };
  
  // Get calories
  const calories = await AppleHealthKit.getDailyNutritionSamples(
    'dietaryEnergyConsumed',
    options
  );
  
  // Get macros
  const protein = await AppleHealthKit.getDailyNutritionSamples('dietaryProtein', options);
  const carbs = await AppleHealthKit.getDailyNutritionSamples('dietaryCarbohydrates', options);
  const fat = await AppleHealthKit.getDailyNutritionSamples('dietaryFatTotal', options);
  
  return {
    calories: calories.value,
    protein: protein.value,
    carbs: carbs.value,
    fat: fat.value
  };
}
```

### Cost Analysis
- **API Costs:** $0
- **Development Time:** 1-2 weeks
- **Maintenance:** Minimal (Apple maintains HealthKit)

---

## Option 2: Terra API (Nutrition Aggregator)

### What It Is

Terra API is a **unified health API** that connects to 300+ fitness/nutrition apps including:
- MyFitnessPal
- Cronometer
- Foodnoms
- MacroFactor
- Fitbit (nutrition)
- And many more

### What You Get

```json
{
  "nutrition": {
    "summary": {
      "calories": 2150,
      "protein_g": 165,
      "carbs_g": 210,
      "fat_g": 70,
      "fiber_g": 28,
      "sugar_g": 45,
      "sodium_mg": 2300
    },
    "meals": [
      {
        "name": "Breakfast",
        "time": "08:30",
        "calories": 450,
        "protein_g": 25,
        "carbs_g": 50,
        "fat_g": 15
      },
      {
        "name": "Lunch",
        "time": "12:45",
        "calories": 650,
        "protein_g": 45,
        "carbs_g": 70,
        "fat_g": 25
      }
    ]
  }
}
```

### Pros
- ✅ **Multi-platform** (iOS, Android, Web)
- ✅ **One API for all nutrition apps** (no need to integrate each separately)
- ✅ **Meal-level detail** (not just daily totals)
- ✅ **Webhook support** (real-time updates)
- ✅ **Historical data** (backfill past nutrition logs)
- ✅ **Includes MyFitnessPal & Cronometer** (the two biggest nutrition apps)

### Cons
- ❌ **Expensive** ($49-199/month depending on volume)
- ❌ **Requires external service** (dependency risk)
- ❌ **User must connect via OAuth** (extra friction)
- ❌ **Rate limits apply** (varies by plan)
- ❌ **Data quality still depends on source app**

### Pricing (Terra API)

| Plan | Cost | Requests/Month | Users |
|------|------|----------------|-------|
| **Starter** | $49/mo | 10,000 | Up to 100 |
| **Growth** | $99/mo | 50,000 | Up to 500 |
| **Pro** | $199/mo | 200,000 | Up to 2,000 |
| **Enterprise** | Custom | Unlimited | Unlimited |

### Implementation Effort
⏱️ **2-3 weeks** for full implementation

### Cost Analysis
- **API Costs:** $588-2,388/year (depending on tier)
- **Development Time:** 2-3 weeks
- **Maintenance:** Medium (Terra maintains provider integrations)

---

## Option 3: MyFitnessPal Direct API (NOT AVAILABLE)

### Status: ❌ Private API Only

MyFitnessPal **does not offer a public API**. From their developer portal:

> "The MyFitnessPal API is currently a private API available to approved developers only. If you are interested in integrating with the MyFitnessPal API, please contact API@myfitnesspal.com"

### What This Means
- ❌ **No public access**
- ❌ **Invitation only** (requires business partnership)
- ❌ **Unknown pricing** (likely enterprise-level)
- ❌ **Long approval process** (if approved at all)

### Workarounds
1. **Use Apple Health** (MyFitnessPal exports to it)
2. **Use Terra API** (includes MyFitnessPal integration)
3. **Web scraping** (NOT RECOMMENDED - violates ToS, fragile, unethical)

---

## Option 4: Cronometer Direct API (NOT AVAILABLE)

### Status: ❌ No Public API

Cronometer does **not offer a public API** for developers. From their forums:

> "Unfortunately, we don't currently have an API. I would recommend checking back in with us in the future!"

### What This Means
- ❌ **No direct integration**
- ❌ **Only available via Terra** (which costs $49-199/month)
- ❌ **Manual export only** (CSV files)

### Workarounds
1. **Use Apple Health** (Cronometer exports to it)
2. **Use Terra API** (includes Cronometer integration)

---

## Option 5: Google Fit / Health Connect (Android)

### Status: ⚠️ Limited Support

Google Fit **does support nutrition data**, but:
- ⚠️ **Very few apps export to it** (most use Apple Health only)
- ⚠️ **Limited adoption** (Android users typically don't track nutrition in Google Fit)
- ⚠️ **Less comprehensive than Apple Health**

### What It Supports
- ✅ Calories
- ✅ Basic macros (protein, carbs, fat)
- ❌ **Limited micronutrient support**

### Implementation Effort
⏱️ **2-3 weeks** (similar to Apple Health)

### Recommendation
**Not worth implementing initially** due to low adoption. Focus on Apple Health first, then consider Terra API for Android users.

---

## Option 6: Manual Entry (Fallback)

### What It Is
Allow users to manually enter their daily nutrition data.

### Pros
- ✅ **Works for everyone** (iOS, Android, Web)
- ✅ **No API costs**
- ✅ **Simple to implement**
- ✅ **User has full control**

### Cons
- ❌ **High friction** (users must remember to log)
- ❌ **Low accuracy** (estimates, not exact)
- ❌ **Low adoption** (users will skip it)

### Implementation Effort
⏱️ **1 week**

### Recommendation
**Keep as fallback** for users who don't track nutrition in apps.

---

## Recommended Implementation Strategy

### Phase 1: Apple Health Integration (Months 1-2)
**Target:** 80% of iOS users  
**Cost:** $0  
**Effort:** 1-2 weeks

**What to build:**
1. Request HealthKit permissions for nutrition data
2. Read daily calories, protein, carbs, fat
3. Display in app: "You consumed 2,150 calories today (from MyFitnessPal)"
4. Use data to inform workout recommendations:
   - Low carbs → suggest shorter/easier cardio
   - High protein → recovery likely good
   - Low calories + hard training → suggest eating more

**UI Flow:**
```
1. User opens VoiceFit
2. App detects MyFitnessPal exports to Apple Health
3. Prompt: "Would you like VoiceFit to read your nutrition data from Apple Health?"
4. User grants permission
5. VoiceFit automatically pulls nutrition data daily
6. Display in profile: "Today's Nutrition: 2,150 cal | 165g protein | 210g carbs | 70g fat"
```

---

### Phase 2: Terra API for Premium (Months 3-4)
**Target:** 15% of users (cross-platform, Android, power users)  
**Cost:** $99-199/month  
**Effort:** 2-3 weeks

**What to build:**
1. Terra API integration (OAuth flow)
2. Support for MyFitnessPal, Cronometer, MacroFactor, etc.
3. Meal-level detail (not just daily totals)
4. Premium feature ($2.99/month add-on or included in $14.99 tier)

**Pricing Model:**
- Free: Apple Health integration only
- Premium: Terra API + meal-level insights + nutrition coaching

**Break-even analysis:**
- Need 50 premium users at $2.99/month to cover $99/month Terra cost
- Need 100 premium users to cover $199/month Terra cost

---

### Phase 3: Manual Entry Fallback (Ongoing)
**Target:** 5% of users (Android, non-trackers)  
**Cost:** $0  
**Effort:** 1 week

**What to build:**
1. Simple form: "Log today's nutrition"
2. Fields: Calories, Protein, Carbs, Fat
3. Optional: Pre-set macros (e.g., "High protein day", "Carb refeed")

---

## Data Use Cases

### What to do with nutrition data:

1. **Readiness Score Adjustment**
   - Low calories + hard training → flag as potential under-recovery
   - High carbs → predict better performance on cardio days

2. **Macro Recommendations**
   ```
   User is training for marathon + trying to maintain strength
   → Recommend: 2,500 cal | 150g protein | 350g carbs | 65g fat
   ```

3. **Workout Adjustments**
   - Low carbs + scheduled long run → suggest carb-up or easier pace
   - High protein intake → "Your recovery should be good for tomorrow's leg day"

4. **Progress Analytics**
   ```
   "You've been in a 500 cal/day deficit for 4 weeks while maintaining strength.
   Great job! Consider a refeed week to support recovery."
   ```

5. **AI Coaching Insights**
   ```
   "I noticed your protein intake dropped to 100g/day this week.
   For your training volume, aim for 150-160g to optimize recovery."
   ```

---

## Privacy & Compliance

### Apple Health Integration
- ✅ **HIPAA-exempt** (consumer wellness app, not medical)
- ✅ **User controls access** (can revoke anytime)
- ✅ **Data stays on device** (unless user syncs to iCloud)
- ✅ **Transparent** (iOS shows what data apps access)

### Terra API Integration
- ✅ **GDPR compliant**
- ✅ **OAuth 2.0** (secure authentication)
- ⚠️ **Data flows through Terra servers** (third-party risk)
- ✅ **User can disconnect anytime**

### Legal Requirements
- ✅ **Privacy policy must disclose** nutrition data access
- ✅ **Terms of service must explain** how data is used
- ✅ **User consent required** before accessing data
- ✅ **Option to delete all data** (GDPR right to erasure)

---

## Technical Implementation Details

### Database Schema

```sql
CREATE TABLE user_nutrition_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fat_g INTEGER,
    fiber_g INTEGER,
    sugar_g INTEGER,
    water_ml INTEGER,
    source TEXT NOT NULL CHECK (source IN ('apple_health', 'terra_api', 'manual')),
    source_app TEXT, -- 'myfitnesspal', 'cronometer', etc.
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, source)
);

CREATE TABLE user_nutrition_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    calories_target INTEGER,
    protein_target_g INTEGER,
    carbs_target_g INTEGER,
    fat_target_g INTEGER,
    calculation_method TEXT, -- 'tdee', 'custom', 'coach_set'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_nutrition_date ON user_nutrition_data(user_id, date DESC);
```

### API Endpoints

```typescript
// GET /api/nutrition/today
// Returns today's nutrition data (from Apple Health or Terra)

// GET /api/nutrition/week
// Returns last 7 days of nutrition data

// POST /api/nutrition/manual
// Manual entry fallback

// GET /api/nutrition/targets
// Get user's macro targets

// PUT /api/nutrition/targets
// Update user's macro targets

// GET /api/nutrition/compliance
// Check if user is meeting targets (for coaching insights)
```

---

## Cost-Benefit Analysis

### Scenario 1: Apple Health Only (Recommended for MVP)
- **Development:** 1-2 weeks ($5K-10K)
- **Monthly Cost:** $0
- **Coverage:** 80% of iOS users
- **Break-even:** Immediate (no ongoing costs)

### Scenario 2: Apple Health + Terra API (Premium Feature)
- **Development:** 3-4 weeks ($15K-20K)
- **Monthly Cost:** $99-199 (Terra API)
- **Coverage:** 95% of users (iOS + Android + Web)
- **Break-even:** 50-100 premium subscribers

### Scenario 3: Terra API Only (Not Recommended)
- **Development:** 2-3 weeks ($10K-15K)
- **Monthly Cost:** $99-199 (Terra API)
- **Coverage:** 80% of users
- **Break-even:** Not sustainable (worse coverage, same cost)

---

## Final Recommendation

### Start with Apple Health (Phase 1)
✅ **Best ROI:** Free, covers 80% of users, 1-2 weeks  
✅ **Low risk:** No external dependencies  
✅ **Simple UX:** One-tap permission, automatic sync

### Add Terra API Later (Phase 2)
✅ **When:** After 5,000+ MAU or when Android users demand it  
✅ **How:** Premium feature to offset costs  
✅ **Why:** Meal-level detail, cross-platform support

### Keep Manual Entry (Phase 3)
✅ **For:** Users who don't track in apps  
✅ **Effort:** Minimal (1 week)  
✅ **Value:** Better than nothing

---

## Next Steps

1. **Implement Apple Health integration** (Sprint 1-2)
2. **Test with 50 beta users** (Sprint 3)
3. **Launch to all iOS users** (Sprint 4)
4. **Monitor adoption rate** (Goal: 40%+ connect within 30 days)
5. **Evaluate Terra API** (Month 3-4, if demand warrants it)

---

## References

- Apple HealthKit Documentation: https://developer.apple.com/documentation/healthkit
- Terra API Documentation: https://docs.tryterra.co
- MyFitnessPal API (Private): https://www.myfitnesspal.com/api
- Cronometer Forums (No API): https://forums.cronometer.com/discussion/1801
- MacroFactor Apple Health Export: https://macrofactorapp.com/mm-march-2022/

---

**Document Owner:** Engineering Team  
**Last Updated:** 2025-01-24  
**Status:** Approved for Phase 1 Implementation