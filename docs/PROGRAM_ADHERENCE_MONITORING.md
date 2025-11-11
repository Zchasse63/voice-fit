# 🎯 Program Adherence & Balance Monitoring System

## Overview

This system monitors whether users are following their custom programs and alerts them when they deviate significantly from their intended training plan. It uses a **two-stage approach** to avoid false alarms while catching genuine issues.

---

## 🧠 Core Concept

### **The Problem:**
- User creates custom program: "Glute-focused with 22 sets/week glutes, 9 sets/week chest"
- User actually trains: 8 sets/week glutes, 18 sets/week chest
- **Result:** Not following their own program, wasting potential

### **The Solution:**
1. **Stage 1 (Week 1):** Silently monitor - flag muscle groups below target, give user a chance to self-correct
2. **Stage 2 (Week 2):** If still below target after 7 days, send gentle check-in asking WHY
3. **Adjustment:** Based on user's response (injury, time, motivation), create gradual 4-week adjustment plan

---

## 📊 Database Schema

### **1. `program_adherence_flags` Table**
**Purpose:** Track muscle groups that are below program targets

```sql
CREATE TABLE program_adherence_flags (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  muscle_group TEXT NOT NULL,  -- 'chest', 'glutes', 'back', etc.
  priority TEXT NOT NULL,  -- 'low', 'medium', 'high'
  target_weekly_sets INTEGER NOT NULL,  -- Expected from program
  actual_weekly_sets INTEGER NOT NULL,  -- What user actually did
  variance_percentage NUMERIC NOT NULL,  -- -37.5 means 37.5% below target
  flagged_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,  -- 'monitoring', 'alerted', 'resolved', 'dismissed'
  alerted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);
```

**Example:**
```json
{
  "user_id": "user_123",
  "muscle_group": "chest",
  "priority": "high",
  "target_weekly_sets": 16,
  "actual_weekly_sets": 10,
  "variance_percentage": -37.5,
  "flagged_date": "2025-01-15T00:00:00Z",
  "status": "monitoring"
}
```

---

### **2. `adherence_check_in_responses` Table**
**Purpose:** Store user responses to adherence alerts

```sql
CREATE TABLE adherence_check_in_responses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  flag_id UUID NOT NULL,
  response_type TEXT NOT NULL,  -- 'injury', 'time_constraint', 'equipment', 'motivation', 'fine', 'change_program'
  injury_details JSONB,  -- {body_part, severity, pain_level}
  adjustment_plan JSONB,  -- {muscle_group, current_sets, target_sets, weekly_increment, duration_weeks}
  user_accepted BOOLEAN
);
```

**Example:**
```json
{
  "user_id": "user_123",
  "flag_id": "flag_456",
  "response_type": "motivation",
  "adjustment_plan": {
    "muscle_group": "chest",
    "current_weekly_sets": 10,
    "target_weekly_sets": 16,
    "weekly_increment": 2,
    "duration_weeks": 4
  },
  "user_accepted": true
}
```

---

### **3. `volume_adjustment_plans` Table**
**Purpose:** Track gradual volume adjustments

```sql
CREATE TABLE volume_adjustment_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  muscle_group TEXT NOT NULL,
  current_weekly_sets INTEGER NOT NULL,
  target_weekly_sets INTEGER NOT NULL,
  weekly_increment INTEGER NOT NULL,  -- +2 sets/week
  duration_weeks INTEGER NOT NULL,  -- 4 weeks
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL  -- 'active', 'completed', 'cancelled'
);
```

**Example:**
```json
{
  "user_id": "user_123",
  "muscle_group": "chest",
  "current_weekly_sets": 10,
  "target_weekly_sets": 16,
  "weekly_increment": 2,
  "duration_weeks": 4,
  "start_date": "2025-01-22",
  "end_date": "2025-02-19",
  "status": "active"
}
```

---

### **4. `generated_programs` Table Updates**
**New columns:**

```sql
ALTER TABLE generated_programs
ADD COLUMN weekly_volume_targets JSONB DEFAULT '{}'::jsonb;

ALTER TABLE generated_programs
ADD COLUMN body_part_emphasis JSONB DEFAULT '{
  "chest": "medium",
  "back": "medium",
  "shoulders": "medium",
  "biceps": "medium",
  "triceps": "medium",
  "glutes": "medium",
  "quads": "medium",
  "hamstrings": "medium",
  "calves": "medium",
  "abs": "medium"
}'::jsonb;
```

**Example:**
```json
{
  "program_name": "12-Week Glute Emphasis",
  "weekly_volume_targets": {
    "glutes": 22,
    "quads": 16,
    "hamstrings": 14,
    "chest": 9,
    "back": 12,
    "shoulders": 6,
    "biceps": 4,
    "triceps": 4
  },
  "body_part_emphasis": {
    "glutes": "high",
    "quads": "medium",
    "hamstrings": "medium",
    "chest": "low",
    "back": "medium",
    "shoulders": "low",
    "biceps": "low",
    "triceps": "low"
  }
}
```

---

## 🔄 Two-Stage Monitoring Flow

### **Stage 1: Silent Monitoring (Week 1)**

**Trigger:** Muscle group hits threshold
- HIGH priority: 20% below target
- MEDIUM priority: 30% below target
- LOW priority: 50% below target

**Action:**
1. Create flag in `program_adherence_flags` with `status='monitoring'`
2. **NO alert to user** (give them a chance to self-correct)
3. Continue monitoring for 7 days

**Example:**
```
User's chest target: 16 sets/week (HIGH priority)
User's actual: 10 sets/week
Variance: -37.5% (exceeds 20% threshold)
→ Create flag, start monitoring
→ User sees nothing
```

---

### **Stage 2: User Check-In (Week 2)**

**Trigger:** 7 days after flag created + still below threshold

**Action:**
1. Update flag `status='alerted'`, set `alerted_at`
2. Send notification to user
3. Show check-in UI with options

**Check-In Options:**
1. **I'm dealing with an injury** → Log injury, substitute exercises
2. **I don't have enough time** → Suggest supersets, shorter rest, more frequency
3. **I don't have the right equipment** → Suggest alternative exercises
4. **I'm just not motivated for [muscle group]** → Create gradual adjustment plan
5. **Everything's fine, I'll get back on track** → Dismiss flag
6. **I want to change my program goals** → Redirect to program modification

---

## 📈 Gradual Volume Adjustment (Not 2-Week Blitz)

**User Response:** "I'm just not motivated for upper body"

**AI Creates 4-Week Plan:**
```
Week 1 (Current): 10 sets/week
Week 2: 12 sets/week (+2 sets) ← Add 1 set to 2 exercises
Week 3: 14 sets/week (+2 sets) ← Add 1 set to 2 exercises
Week 4: 16 sets/week (+2 sets) ← Back to program target
```

**Implementation:**
- Add 1 extra set to Bench Press (Monday)
- Add 1 extra set to Incline DB Press (Thursday)
- Repeat each week until back at 16 sets

**Stored in `volume_adjustment_plans` table**

---

## 🚨 Imbalance Risk Detection

**Separate from program adherence** - checks for dangerous imbalances regardless of program:

### **1. Quad/Hamstring Ratio**
- **Safe:** 1.2:1 to 1.5:1
- **Risk:** >2.0:1 (ACL injury risk)

**Example:**
```
Quads: 28 sets/week
Hamstrings: 10 sets/week
Ratio: 2.8:1 → HIGH RISK ALERT
```

### **2. Push/Pull Ratio**
- **Safe:** 1:1 to 1.2:1
- **Risk:** >1.5:1 (shoulder injury risk)

**Example:**
```
Push (chest + shoulders + triceps): 36 sets/week
Pull (back + biceps): 18 sets/week
Ratio: 2:1 → MEDIUM RISK ALERT
```

---

## 🗓️ Weekly Monitoring Schedule

**Every Sunday at 11:59 PM:**

1. **Calculate weekly volume** for all Premium users
2. **Compare to program targets**
3. **Check existing flags:**
   - If flagged 7+ days ago + still below threshold → Send alert
   - If improved → Mark as resolved
4. **Create new flags** for newly detected issues
5. **Check imbalance risks** (quad/ham, push/pull)

---

## 🎯 Priority-Based Thresholds

| Priority | Threshold | Example |
|----------|-----------|---------|
| **HIGH** | 20% below | Glutes in glute-focused program |
| **MEDIUM** | 30% below | Back in balanced program |
| **LOW** | 50% below | Shoulders in glute-focused program |

**Why different thresholds?**
- HIGH priority muscles are the program's focus → strict monitoring
- LOW priority muscles are maintenance → more lenient

---

## 📱 User Experience

### **Home Screen Badge:**
```
🏠 HOME TAB
  ┌─────────────────────────────┐
  │ ⚠️ Training Alert (1)       │
  │ Tap to review               │
  └─────────────────────────────┘
```

### **Alert Detail Screen:**
```
⚠️ Training Imbalance Detected

📊 Last 2 Weeks Analysis:

Your Program: Glute Emphasis
Expected: 22 sets/week glutes

Actual Training:
  Glutes: 10 sets/week ⬇️ -55%

Why This Matters:
• Not following your custom program
• Missing growth potential
• Wasting training time

What's going on?

[I'm dealing with an injury]
[I don't have enough time]
[I don't have the right equipment]
[I'm just not motivated]
[Everything's fine]
[Change my program]
```

---

## 🔧 Backend Services

### **1. ProgramAdherenceMonitor Service**
**File:** `apps/backend/program_adherence_monitor.py`

**Methods:**
- `calculate_weekly_volume(user_id)` - Calculate actual volume by muscle group
- `get_program_targets(user_id)` - Get expected volume from generated_programs
- `check_adherence(user_id)` - Compare actual vs target
- `manage_flags(user_id, flagged_muscles)` - Create/update/resolve flags
- `send_check_in(user_id, alerts)` - Send user check-in notification
- `check_imbalance_risks(actual_volume)` - Detect dangerous imbalances

### **2. VolumeAdjustmentService**
**File:** `apps/backend/volume_adjustment_service.py`

**Methods:**
- `create_adjustment_plan(user_id, muscle_group, current, target)` - Create 4-week plan
- `get_active_plans(user_id)` - Get user's active adjustment plans
- `update_plan_progress(plan_id, week_number)` - Track progress
- `complete_plan(plan_id)` - Mark plan as completed

---

## ✅ Next Steps

1. ✅ **Database migration** - Add 3 new tables + update generated_programs
2. ⏳ **Create ProgramAdherenceMonitor service**
3. ⏳ **Create VolumeAdjustmentService**
4. ⏳ **Create POST /api/adherence/check-in endpoint**
5. ⏳ **Create weekly monitoring job (cron)**
6. ⏳ **Update questionnaire for body part emphasis**
7. ⏳ **Create adherence alert UI component**
8. ⏳ **Test with mock data**

---

**Status:** ✅ Database schema designed and ready to implement

