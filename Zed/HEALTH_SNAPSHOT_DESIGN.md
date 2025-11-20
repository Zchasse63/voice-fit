# Health Snapshot Design Specification

**Date:** 2025-01-20  
**Purpose:** Daily AI-generated health snapshots combining wearables, training, and nutrition data  
**Status:** Implementation Ready  
**Priority:** P2 - AI Health Intelligence

---

## Overview

Health Snapshots are daily AI-generated summaries that provide users with actionable insights by correlating:
- Wearable data (sleep, HRV, recovery, activity)
- Training data (volume, intensity, adherence)
- Nutrition data (calories, macros, hydration)
- Subjective metrics (readiness, soreness, mood)

---

## Database Schema

### `health_snapshots` Table

```sql
CREATE TABLE health_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Wearable Metrics
  sleep_duration_hours DECIMAL(4,2),
  sleep_quality_score INTEGER, -- 0-100
  hrv_score INTEGER, -- milliseconds
  resting_heart_rate INTEGER, -- bpm
  recovery_score INTEGER, -- 0-100 (Whoop/Oura style)
  
  -- Training Metrics
  training_volume_minutes INTEGER,
  training_intensity_score INTEGER, -- 0-100
  adherence_percentage DECIMAL(5,2),
  workouts_completed INTEGER,
  workouts_scheduled INTEGER,
  
  -- Nutrition Metrics
  calories_consumed INTEGER,
  protein_grams DECIMAL(6,2),
  carbs_grams DECIMAL(6,2),
  fats_grams DECIMAL(6,2),
  hydration_liters DECIMAL(4,2),
  
  -- Subjective Metrics
  readiness_score INTEGER, -- 1-5 (user-reported)
  soreness_level INTEGER, -- 1-5 (user-reported)
  mood_score INTEGER, -- 1-5 (user-reported)
  
  -- AI-Generated Insights
  ai_summary TEXT, -- Natural language summary
  ai_recommendations JSONB, -- Array of recommendations
  risk_flags JSONB, -- Array of risk indicators
  
  -- Metadata
  data_completeness_score INTEGER, -- 0-100 (how much data was available)
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_health_snapshots_user_date ON health_snapshots(user_id, date DESC);
CREATE INDEX idx_health_snapshots_generated ON health_snapshots(generated_at DESC);

-- RLS Policies
ALTER TABLE health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON health_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view client snapshots"
  ON health_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_id = health_snapshots.user_id
      AND coach_id = auth.uid()
      AND status = 'active'
    )
  );
```

---

## AI Snapshot Generation

### Prompt Template

```
You are a health and fitness AI analyzing a user's daily health data.

**User Profile:**
- Name: {user_name}
- Goals: {user_goals}
- Training Level: {training_level}

**Today's Data ({date}):**

**Sleep & Recovery:**
- Sleep Duration: {sleep_duration} hours
- Sleep Quality: {sleep_quality}/100
- HRV: {hrv} ms
- Resting HR: {rhr} bpm
- Recovery Score: {recovery_score}/100

**Training:**
- Volume: {training_volume} minutes
- Intensity: {training_intensity}/100
- Adherence: {adherence}%
- Workouts: {workouts_completed}/{workouts_scheduled}

**Nutrition:**
- Calories: {calories} kcal
- Protein: {protein}g | Carbs: {carbs}g | Fats: {fats}g
- Hydration: {hydration}L

**Subjective:**
- Readiness: {readiness}/5
- Soreness: {soreness}/5
- Mood: {mood}/5

**Instructions:**
1. Generate a concise 2-3 sentence summary of the user's health status
2. Identify 2-3 specific, actionable recommendations
3. Flag any risks (overtraining, poor recovery, nutrition deficits)
4. Use a supportive, coaching tone

**Output Format (JSON):**
{
  "summary": "...",
  "recommendations": ["...", "...", "..."],
  "risk_flags": ["..."]
}
```

---

## Background Job

### Cron Schedule
- **Frequency:** Daily at 6:00 AM user local time
- **Trigger:** Supabase Edge Function or backend cron job

### Generation Logic

```python
async def generate_daily_snapshot(user_id: str, date: str):
    # 1. Fetch wearable data
    sleep = await fetch_sleep_data(user_id, date)
    metrics = await fetch_health_metrics(user_id, date)
    
    # 2. Fetch training data
    workouts = await fetch_workouts(user_id, date)
    adherence = await calculate_adherence(user_id, date)
    
    # 3. Fetch nutrition data
    nutrition = await fetch_nutrition(user_id, date)
    
    # 4. Fetch subjective metrics
    readiness = await fetch_readiness_score(user_id, date)
    
    # 5. Calculate data completeness
    completeness = calculate_completeness([sleep, metrics, workouts, nutrition, readiness])
    
    # 6. Generate AI insights
    ai_response = await generate_ai_insights(user_id, {
        "sleep": sleep,
        "metrics": metrics,
        "workouts": workouts,
        "nutrition": nutrition,
        "readiness": readiness
    })
    
    # 7. Insert snapshot
    snapshot = {
        "user_id": user_id,
        "date": date,
        **sleep,
        **metrics,
        **workouts,
        **nutrition,
        **readiness,
        "ai_summary": ai_response["summary"],
        "ai_recommendations": ai_response["recommendations"],
        "risk_flags": ai_response["risk_flags"],
        "data_completeness_score": completeness
    }
    
    await supabase.table("health_snapshots").upsert(snapshot).execute()
```

---

## API Endpoints

### GET `/api/health/snapshots/{user_id}`
- **Query Params:** `start_date`, `end_date`, `limit`
- **Returns:** Array of health snapshots
- **Auth:** User or assigned coach

### GET `/api/health/snapshots/{user_id}/latest`
- **Returns:** Most recent snapshot
- **Auth:** User or assigned coach

### POST `/api/health/snapshots/{user_id}/generate`
- **Body:** `{ "date": "2025-01-20" }`
- **Returns:** Generated snapshot
- **Auth:** User only (manual regeneration)

---

## Mobile UI

### HealthSnapshotCard Component
- **Location:** Dashboard home screen (top card)
- **Content:**
  - Date
  - Recovery score (large circular progress)
  - AI summary (2-3 sentences)
  - Top 2 recommendations (bullet points)
  - Risk flags (warning badges)
- **Actions:**
  - Tap to view full details
  - Swipe to view previous days

---

## Success Metrics

- **Engagement:** % of users viewing snapshots daily
- **Actionability:** % of recommendations acted upon
- **Accuracy:** User feedback on insight relevance
- **Data Coverage:** Average completeness score

---

## Future Enhancements

1. **Trend Analysis:** 7-day, 30-day trend charts
2. **Predictive Insights:** "Based on your pattern, you may need a deload week"
3. **Comparative Analysis:** "Your recovery is 15% better than last month"
4. **Push Notifications:** "Your snapshot is ready!"

