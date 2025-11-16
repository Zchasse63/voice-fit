# Action Plan: Unblock Integration Tests via Exercise Seeding

## 🚨 Current Status

**Problem:** Integration tests are failing because exercise database is not seeded.

**Impact:** 
- Voice logging endpoint cannot save sets (exercise_id is null)
- Integration tests fail even though code is correct
- No way to verify end-to-end workflow

**Root Cause:**
```json
{
  "exercise_id": null,           // ← No exercise found
  "exercise_name": "Bench press", // Parser extracted correctly
  "exercise_match_score": null,   // ← Upstash Search returned nothing
  "set_ids": []                   // ← Save failed, no IDs returned
}
```

---

## ✅ Option 1: Seed Exercises Database (RECOMMENDED)

### Step 1: Check Current Exercise Table

```sql
-- Connect to Supabase and check exercises table
SELECT COUNT(*) FROM exercises;
SELECT * FROM exercises LIMIT 10;
```

**Expected:** Table exists but is empty or has very few exercises.

### Step 2: Create Exercise Seeding Migration

**File:** `supabase/migrations/YYYYMMDD_seed_standard_exercises.sql`

```sql
-- Seed standard exercises for testing and production use
INSERT INTO exercises (id, name, category, muscle_group, equipment, description)
VALUES
  -- Upper Body Push
  (gen_random_uuid(), 'Bench Press', 'strength', 'chest', 'barbell', 'Flat barbell bench press'),
  (gen_random_uuid(), 'Incline Bench Press', 'strength', 'chest', 'barbell', 'Incline barbell bench press'),
  (gen_random_uuid(), 'Overhead Press', 'strength', 'shoulders', 'barbell', 'Standing barbell overhead press'),
  (gen_random_uuid(), 'Dumbbell Press', 'strength', 'chest', 'dumbbell', 'Flat dumbbell bench press'),
  (gen_random_uuid(), 'Push-ups', 'strength', 'chest', 'bodyweight', 'Standard push-ups'),
  
  -- Upper Body Pull
  (gen_random_uuid(), 'Deadlift', 'strength', 'back', 'barbell', 'Conventional deadlift'),
  (gen_random_uuid(), 'Romanian Deadlift', 'strength', 'hamstrings', 'barbell', 'Romanian deadlift'),
  (gen_random_uuid(), 'Pull-ups', 'strength', 'back', 'bodyweight', 'Standard pull-ups'),
  (gen_random_uuid(), 'Barbell Row', 'strength', 'back', 'barbell', 'Bent-over barbell row'),
  (gen_random_uuid(), 'Lat Pulldown', 'strength', 'back', 'cable', 'Lat pulldown machine'),
  
  -- Lower Body
  (gen_random_uuid(), 'Squat', 'strength', 'legs', 'barbell', 'Back squat'),
  (gen_random_uuid(), 'Front Squat', 'strength', 'legs', 'barbell', 'Front squat'),
  (gen_random_uuid(), 'Leg Press', 'strength', 'legs', 'machine', 'Leg press machine'),
  (gen_random_uuid(), 'Lunges', 'strength', 'legs', 'bodyweight', 'Walking lunges'),
  (gen_random_uuid(), 'Leg Curl', 'strength', 'hamstrings', 'machine', 'Lying leg curl'),
  
  -- Accessories
  (gen_random_uuid(), 'Bicep Curl', 'strength', 'biceps', 'dumbbell', 'Dumbbell bicep curl'),
  (gen_random_uuid(), 'Tricep Extension', 'strength', 'triceps', 'cable', 'Cable tricep extension'),
  (gen_random_uuid(), 'Cable Fly', 'strength', 'chest', 'cable', 'Cable chest fly'),
  (gen_random_uuid(), 'Face Pull', 'strength', 'shoulders', 'cable', 'Cable face pull')
ON CONFLICT (name) DO NOTHING;  -- Prevent duplicates if re-run
```

### Step 3: Apply Migration

```bash
# From VoiceFit root directory
cd supabase
npx supabase db push

# OR apply directly via Supabase dashboard SQL editor
```

### Step 4: Verify Exercise Data

```sql
-- Check exercises were inserted
SELECT id, name, category FROM exercises ORDER BY name;

-- Should return ~19 exercises
```

---

## ✅ Option 2: Sync Exercises to Upstash Search

After seeding the database, exercises need to be indexed in Upstash Search.

### Step 1: Check Upstash Configuration

```bash
# Verify environment variables in Railway
# UPSTASH_URL=https://your-endpoint.upstash.io
# UPSTASH_TOKEN=your-token-here
```

### Step 2: Create Upstash Sync Script

**File:** `apps/backend/scripts/sync_exercises_to_upstash.py`

```python
import os
from supabase import create_client
from upstash_vector import Index

# Initialize clients
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

index = Index(
    url=os.getenv("UPSTASH_URL"),
    token=os.getenv("UPSTASH_TOKEN")
)

# Fetch all exercises
response = supabase.table("exercises").select("*").execute()
exercises = response.data

# Index each exercise
for exercise in exercises:
    index.upsert(
        vectors=[{
            "id": exercise["id"],
            "data": exercise["name"],
            "metadata": {
                "name": exercise["name"],
                "category": exercise["category"],
                "muscle_group": exercise.get("muscle_group")
            }
        }]
    )
    print(f"Indexed: {exercise['name']}")

print(f"\nTotal exercises indexed: {len(exercises)}")
```

### Step 3: Run Sync Script

```bash
cd apps/backend
python scripts/sync_exercises_to_upstash.py
```

---

## ✅ Option 3: Quick Fix - Make exercise_id Nullable (TEMPORARY)

If you need tests to run immediately while fixing the above:

### Step 1: Check Current Schema

```sql
-- Check if exercise_id is required
\d workout_logs
-- Look for NOT NULL constraint on exercise_id
```

### Step 2: Make exercise_id Optional (if needed)

```sql
-- Remove NOT NULL constraint temporarily
ALTER TABLE workout_logs 
ALTER COLUMN exercise_id DROP NOT NULL;
```

### Step 3: Update Parser to Save Without exercise_id

The parser already handles this correctly - it removes null values before inserting. So if exercise_id is nullable, saves will succeed.

**Note:** This is NOT recommended for production, only for unblocking tests.

---

## 🧪 Verification Steps

After implementing Option 1 + Option 2:

### 1. Test Exercise Lookup via API

```bash
# Call the parse endpoint to test exercise matching
curl -X POST https://voice-fit-production.up.railway.app/api/voice/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "transcript": "Bench press 185 for 8 reps",
    "user_id": "test-user-id"
  }'

# Expected response:
# {
#   "data": {
#     "exercise_id": "abc-123-...",  // ← Should NOT be null!
#     "exercise_name": "Bench Press",
#     "exercise_match_score": 0.98,
#     ...
#   }
# }
```

### 2. Test Voice Logging Endpoint

```bash
curl -X POST https://voice-fit-production.up.railway.app/api/voice/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "voice_input": "Bench press 185 for 8 reps",
    "user_id": "test-user-id"
  }'

# Expected response:
# {
#   "success": true,
#   "set_ids": ["uuid-here"],  // ← Should NOT be empty!
#   ...
# }
```

### 3. Verify Database Record

```sql
-- Check that set was actually saved
SELECT * FROM workout_logs 
WHERE user_id = 'test-user-id' 
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- - Valid exercise_id (not null)
-- - weight = 185
-- - reps = 8
```

### 4. Run Integration Tests

```bash
cd apps/mobile
npx jest --testMatch='**/__tests__/integration/**/voice-to-database.test.ts' \
  -t "should log voice workout and store in Supabase"

# Expected: PASS ✓
```

---

## 📋 Success Criteria

✅ Exercise table has 15-20 standard exercises  
✅ Upstash Search returns matches for common exercises  
✅ `/api/voice/parse` returns non-null `exercise_id`  
✅ `/api/voice/log` returns non-empty `set_ids` array  
✅ Database contains saved workout_logs records  
✅ Integration tests pass without modifications  

---

## 🔍 Troubleshooting

### "Upstash still returns no matches"

1. Check Upstash dashboard - is the index created?
2. Verify UPSTASH_URL and UPSTASH_TOKEN in Railway env vars
3. Check if index has data: run a test query in Upstash console
4. Re-run sync script with verbose logging

### "Database save still fails"

1. Check foreign key constraints on `workout_logs.exercise_id`
2. Verify exercises table has `id` column that matches the UUID format
3. Check Railway logs for Python exceptions during save
4. Try manual INSERT to test constraint behavior

### "Tests pass but no data in Supabase dashboard"

1. Check if test is using correct Supabase project
2. Verify EXPO_PUBLIC_SUPABASE_URL in mobile .env
3. Check RLS policies - test user might not have SELECT permission
4. Use service key to query directly (bypass RLS)

---

## 📅 Timeline

**Immediate (30 minutes):**
- Create and apply exercise seeding migration
- Verify exercises in Supabase dashboard

**Short-term (1 hour):**
- Create and run Upstash sync script
- Test exercise matching via curl

**Validation (30 minutes):**
- Run integration tests
- Verify all checks pass
- Update documentation

**Total Time:** ~2 hours to fully unblock integration testing

---

## 🎯 Next Steps After This Is Done

1. ✅ Integration tests will pass
2. ✅ Can proceed with auth stabilization
3. ✅ Can expand test coverage to Sprint 2-3 features
4. ✅ Can add exercise seeding to CI/CD pipeline
5. ✅ Can document exercise management for future contributors

---

**Priority:** 🔴 **CRITICAL** - Blocks all integration testing  
**Owner:** Backend team  
**Status:** Ready to implement  
**ETA:** 2 hours