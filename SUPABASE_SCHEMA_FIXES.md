# Supabase Schema Fixes - Completed

**Date:** 2025-01-XX  
**Status:** ✅ Complete  
**Environment:** Voice Fit Production (szragdskusayriycfhrs)

---

## Summary

All Supabase schema issues identified in the RAG Redis integration testing have been resolved. The primary issue was a **unit mismatch** in the badge system where the database stores distances in kilometers but the badge service was checking for milestones in miles.

---

## Issues Identified & Fixed

### 1. ✅ Badge System - Distance Unit Conversion (FIXED)

**Problem:**
- Database `runs` table stores distances in **kilometers** (`distance` column)
- Badge service was expecting distances in **miles**
- Badge thresholds are defined in miles (3.1 for 5K, 6.2 for 10K, etc.)
- This caused badges to never be awarded or be awarded incorrectly

**Root Cause:**
```python
# OLD CODE - Incorrect
run_distance = run_data.get('distance_miles', 0)  # Column doesn't exist!
# OR
run_distance = run_data.get('distance', 0)  # In km, but checked against miles
```

**Solution:**
Modified `apps/backend/badge_service.py` to convert km to miles (factor: 0.621371) in four key methods:

1. **`_get_total_run_distance()`** - Line 813-842
   - Now converts total km to miles before returning
   - Updated docstring to clarify conversion

2. **`check_run_badges()`** - Line 475-495
   - Converts single run distance from km to miles before checking milestones
   - Fixed column reference from `distance_miles` to `distance`

3. **`_check_run_speed_badges()`** - Line 516-548
   - Converts km to miles for 5K/10K/Mile speed checks

4. **`_check_run_pace_badges()`** - Line 551-570
   - Converts km to miles for pace calculations (minutes per mile)

**Files Modified:**
- `apps/backend/badge_service.py`

**Testing:**
- Badge service now correctly reads `distance` column (in km)
- Converts to miles for all badge checks
- 90 badge definitions remain unchanged (still in miles as intended)

---

### 2. ✅ Injury Check-In Response (Already Correct)

**Status:** No changes needed

**Verification:**
- Endpoint: `POST /api/v1/injury/{injury_id}/check-in`
- Response model `RecoveryCheckInResponse` already includes:
  - ✅ `progress_score` (float 0.0-1.0)
  - ✅ `recommendation` (string)
  - ✅ `status` (string: improving/plateau/worsening/resolved)
  - ✅ `requires_medical_attention` (boolean)
  - ✅ `days_in_recovery` (int)
  - ✅ `updated_injury` (InjuryLogResponse)

**Database Schema:**
```sql
-- injury_logs table - Correct
id, user_id, body_part, severity, description, status, 
reported_at, last_check_in_at, resolved_at, created_at, updated_at
```

---

### 3. ✅ Adherence Check-In Schema (Already Correct)

**Status:** No changes needed

**Verification:**
- Endpoint: `POST /api/v1/adherence/check-in`
- Request accepts:
  - ✅ `flag_id` (uuid) - Required
  - ✅ `response_type` (text) - Required
  - ✅ `injury_details` (jsonb) - Optional
  - ✅ `adjustment_plan` (jsonb) - Optional

**Database Schema:**
```sql
-- adherence_check_in_responses table - Correct
CREATE TABLE adherence_check_in_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    flag_id uuid NOT NULL REFERENCES program_adherence_flags(id),
    response_type text NOT NULL CHECK (response_type IN ('injury', 'time_constraint', 'equipment', 'motivation', 'fine', 'change_program')),
    injury_details jsonb,
    adjustment_plan jsonb,
    user_accepted boolean,
    created_at timestamptz DEFAULT now()
);

-- program_adherence_flags table - Correct  
CREATE TABLE program_adherence_flags (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    muscle_group text NOT NULL,
    priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    target_weekly_sets integer NOT NULL,
    actual_weekly_sets integer NOT NULL,
    variance_percentage numeric NOT NULL,
    status text NOT NULL DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'alerted', 'resolved', 'dismissed')),
    flagged_date timestamptz DEFAULT now(),
    -- ... other timestamp fields
);
```

---

## Database Schema Verification

### Runs Table
```sql
-- CORRECT: Uses 'distance' column (in kilometers)
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'runs' AND column_name = 'distance';

Result: distance | numeric
```

### User Badges Table
```sql
-- CORRECT: No distance/weight columns needed (badges are just records)
CREATE TABLE user_badges (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    badge_type text NOT NULL,
    badge_name text NOT NULL,
    badge_description text NOT NULL,
    earned_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    viewed boolean DEFAULT false
);
```

---

## Testing Recommendations

### 1. Badge System Integration Tests
```python
# Test case: Run 5km (3.1 miles) should award 5K badge
run_data = {
    "distance": 5.0,  # km
    "duration_seconds": 1500,
    "user_id": "test-user"
}
badges = await badge_service.check_run_badges(user_id, run_data)
assert "run_distance_single_5k" in badges
```

### 2. Total Distance Badge Test
```python
# Test case: 100km total = ~62 miles, should award 50-mile badge
# Create 20 runs of 5km each
# Should earn: run_distance_total_50
```

### 3. Pace Badge Test
```python
# Test case: 8km in 40 minutes
run_data = {
    "distance": 8.0,  # km
    "duration_seconds": 2400  # 40 minutes
}
# 8km = 4.97 miles, 40 min / 4.97 = 8.05 min/mile
# Should earn: run_pace_sub_9 badge (if under 9:00/mile)
```

---

## Migration History

**No SQL migrations required** - Only application code changes.

Changes are **backward compatible**:
- Database schema unchanged
- Only badge service logic updated
- Existing data remains valid

---

## Production Deployment Checklist

- [x] Badge service code updated
- [x] Unit conversion verified (0.621371 km-to-miles factor)
- [x] All 90 badge definitions remain in miles
- [x] Injury check-in response verified correct
- [x] Adherence schema verified correct
- [x] No database migrations needed
- [ ] Run integration tests against production
- [ ] Verify badge awards for existing runs
- [ ] Monitor badge service logs for errors

---

## Known Limitations

1. **Historical badges**: Users who ran before this fix may not have received badges they earned. Consider:
   - Running a one-time backfill script
   - Or letting badges accrue naturally going forward

2. **Mixed units**: System stores in km but displays in miles for badges. Consider:
   - Documenting this clearly in API docs
   - Or standardizing on one unit system-wide (future refactor)

---

## Related Files

- `apps/backend/badge_service.py` - Badge detection logic (MODIFIED)
- `apps/backend/injury_models.py` - Injury response models (NO CHANGE)
- `apps/backend/main.py` - API endpoints (NO CHANGE)
- Database: `runs`, `user_badges`, `injury_logs`, `program_adherence_flags`, `adherence_check_in_responses`

---

## Contact

For questions or issues related to these fixes, contact the backend team or refer to:
- Integration test suite: `apps/backend/test_rag_redis_integration.py`
- Full test runner: `apps/backend/run_integration_tests.py`
