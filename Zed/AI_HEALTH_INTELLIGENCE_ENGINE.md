# AI Health Intelligence Engine - Technical Planning Document

**Date:** 2025-01-24  
**Purpose:** Design an AI-powered system to discover hidden correlations between nutrition, performance, recovery, and injuries  
**Status:** Planning Phase  
**Timeline:** 12-18 months (post-wearable integration)  
**Code Name:** Project INSIGHT

---

## Table of Contents

1. [Executive Vision](#executive-vision)
2. [Core Concept](#core-concept)
3. [Data Inputs](#data-inputs)
4. [Intelligence Types](#intelligence-types)
5. [AI/ML Architecture](#aiml-architecture)
6. [Database Design](#database-design)
7. [Example Insights](#example-insights)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Challenges](#technical-challenges)
10. [Success Metrics](#success-metrics)
11. [Privacy & Ethics](#privacy--ethics)

---

## Executive Vision

### The Problem

Athletes and fitness enthusiasts generate massive amounts of health data:
- Nutrition logs (MyFitnessPal, Cronometer)
- Workout data (VoiceFit, Strava, Garmin)
- Biometrics (Whoop, Oura, Apple Watch)
- Sleep data (Eight Sleep, Oura)
- Body metrics (Withings scale, InBody)

**But this data lives in silos.** Users can't see the connections:
- Does high protein intake actually help recovery?
- Why did my running pace drop even though my training volume is consistent?
- Is my shoulder injury related to poor sleep or overtraining?
- Should I eat more carbs on leg day vs. upper body day?

### The Solution

**VoiceFit AI Health Intelligence Engine** - An AI system that:
1. **Aggregates** all health data sources
2. **Analyzes** patterns across nutrition, performance, recovery, injuries
3. **Discovers** hidden correlations using machine learning
4. **Predicts** outcomes (injury risk, performance plateaus, optimal nutrition)
5. **Recommends** personalized actions based on YOUR data

### The Differentiator

**No other app does this comprehensively.** Competitors offer:
- Whoop: Recovery insights, but no nutrition or strength training analysis
- TrainingPeaks: Performance analytics, but weak on nutrition and biometrics
- MyFitnessPal: Nutrition tracking, but zero integration with performance
- Strong/Hevy: Workout logging, but no recovery or nutrition insights

**VoiceFit will be the ONLY app that connects all the dots.**

---

## Core Concept

### Multi-Dimensional Health Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                    USER HEALTH DATA                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Nutrition│ Strength │ Cardio   │Biometrics│  Body    │  │
│  │  Data    │  Data    │  Data    │   Data   │  Metrics │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        AI INTELLIGENCE ENGINE                         │  │
│  │  • Pattern Recognition                                │  │
│  │  • Correlation Analysis                               │  │
│  │  • Causal Inference                                   │  │
│  │  • Predictive Modeling                                │  │
│  │  • Anomaly Detection                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               ACTIONABLE INSIGHTS                     │  │
│  │  "Your protein intake below 140g correlates with     │  │
│  │   slower recovery and 15% drop in volume. Increase   │  │
│  │   to 160g on heavy training days."                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Inputs

### 1. Nutrition Data

**Source:** Apple Health, Terra API, Manual Entry

```typescript
interface NutritionData {
  date: Date;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  water_ml: number;
  meal_timing?: {
    breakfast_time?: string;
    pre_workout_carbs?: number;
    post_workout_protein?: number;
  };
  
  // Derived metrics
  protein_per_kg_bodyweight: number; // e.g., 2.0g/kg
  carb_protein_ratio: number; // e.g., 2.5:1
  calorie_surplus_deficit: number; // vs TDEE
}
```

### 2. Strength Training Data

**Source:** VoiceFit workout logs

```typescript
interface StrengthData {
  date: Date;
  workout_id: string;
  exercises: {
    name: string;
    sets: number;
    reps: number[];
    weight: number[];
    volume_load: number; // total weight × reps
    rpe: number[]; // rating of perceived exertion
    rest_periods: number[];
  }[];
  
  // Aggregated metrics
  total_volume: number; // sum of all volume loads
  avg_intensity: number; // % of 1RM
  time_under_tension: number;
  workout_duration: number;
  muscle_groups_trained: string[];
  
  // Performance indicators
  pr_achieved: boolean;
  volume_vs_last_week: number; // % change
  fatigue_score: number; // calculated
}
```

### 3. Cardio/Running Data

**Source:** Apple Health, Strava, Garmin, Whoop

```typescript
interface CardioData {
  date: Date;
  workout_type: 'run' | 'bike' | 'swim' | 'row';
  distance_km: number;
  duration_seconds: number;
  avg_pace: number; // seconds per km
  avg_heart_rate: number;
  max_heart_rate: number;
  elevation_gain_meters: number;
  
  // Zone distribution
  zone1_time: number;
  zone2_time: number;
  zone3_time: number;
  zone4_time: number;
  zone5_time: number;
  
  // Performance metrics
  hr_at_pace: { pace: number; hr: number }[]; // efficiency
  cardiac_drift: number; // HR increase during steady pace
  perceived_effort: number;
  
  // Environmental
  temperature: number;
  humidity: number;
  surface_type: 'road' | 'trail' | 'track' | 'treadmill';
}
```

### 4. Biometric Data

**Source:** Apple Watch, Whoop, Oura, Garmin

```typescript
interface BiometricData {
  date: Date;
  
  // Sleep
  sleep_duration_hours: number;
  sleep_quality_score: number; // 0-100
  deep_sleep_minutes: number;
  rem_sleep_minutes: number;
  sleep_disruptions: number;
  
  // Recovery
  hrv_ms: number; // heart rate variability
  resting_heart_rate: number;
  recovery_score: number; // Whoop-style 0-100
  
  // Readiness
  readiness_score: number;
  strain_score: number; // accumulated stress
  
  // Stress
  stress_score: number;
  respiratory_rate: number;
  spo2: number; // blood oxygen
}
```

### 5. Body Metrics

**Source:** Smart scales (Withings, FitBit Aria), Manual entry

```typescript
interface BodyMetrics {
  date: Date;
  weight_kg: number;
  body_fat_percentage: number;
  muscle_mass_kg: number;
  bone_mass_kg: number;
  water_percentage: number;
  
  // Derived
  lean_body_mass_kg: number;
  weight_change_7d: number;
  weight_change_30d: number;
  body_fat_change_7d: number;
}
```

### 6. Injury Data

**Source:** VoiceFit injury logs

```typescript
interface InjuryData {
  date: Date;
  body_part: string;
  injury_type: string;
  severity: 1 | 2 | 3 | 4 | 5;
  pain_level: number; // 1-10
  affected_movements: string[];
  
  // Context
  days_since_last_rest: number;
  training_volume_last_7d: number;
  training_volume_last_30d: number;
  volume_spike_percentage: number; // vs previous period
  
  // Resolution
  resolution_days?: number;
  return_to_activity_date?: Date;
}
```

---

## Intelligence Types

### 1. Correlation Discovery

**Find relationships between variables that users wouldn't notice manually.**

#### Example Analyses:
```sql
-- Does protein intake correlate with strength gains?
SELECT 
  nutrition.avg_protein_per_kg,
  strength.volume_change_percentage,
  CORR(nutrition.avg_protein_per_kg, strength.volume_change_percentage) as correlation
FROM weekly_nutrition_summary nutrition
JOIN weekly_strength_summary strength ON nutrition.user_id = strength.user_id
WHERE nutrition.user_id = 'user123'
GROUP BY nutrition.avg_protein_per_kg, strength.volume_change_percentage;
```

#### Correlation Types to Analyze:

**Nutrition ↔ Strength:**
- Protein intake → Volume progression
- Carb intake → Performance on leg days vs upper body days
- Calorie surplus → Muscle gain rate
- Pre-workout carbs → Workout quality (RPE, volume)
- Post-workout protein timing → Recovery speed

**Nutrition ↔ Cardio:**
- Carb intake → Running pace at same HR
- Hydration → Cardiac drift
- Sodium intake → Performance in hot weather
- Fat intake → Endurance performance

**Nutrition ↔ Recovery:**
- Protein intake → HRV trends
- Carb intake → Sleep quality
- Overall calories → Recovery score
- Micronutrient intake → Immune system markers

**Training Volume ↔ Recovery:**
- Weekly volume → HRV decline
- Intensity (% 1RM) → Sleep quality
- Training frequency → Resting HR elevation
- Volume spikes → Recovery score drops

**Training Volume ↔ Injuries:**
- Volume increases >20% week-over-week → Injury incidence
- Consecutive high-volume weeks → Specific injury types
- Insufficient rest days → Overuse injuries
- Training frequency per muscle group → Joint pain

**Sleep ↔ Performance:**
- Sleep duration → Strength performance
- Sleep quality → Running pace
- Deep sleep → Recovery from hard sessions
- Sleep disruptions → Injury risk

**Body Metrics ↔ Performance:**
- Weight changes → Strength-to-weight ratio
- Body fat percentage → Endurance performance
- Lean mass changes → Volume tolerance

---

### 2. Pattern Recognition

**Identify recurring patterns that predict outcomes.**

#### Pattern Types:

**Performance Decline Patterns:**
```typescript
interface PerformanceDeclinePattern {
  pattern_id: string;
  pattern_name: "Overreaching";
  indicators: [
    {
      metric: "weekly_volume",
      threshold: "> baseline + 30%",
      duration: "2+ weeks"
    },
    {
      metric: "sleep_quality",
      threshold: "< 70",
      duration: "5+ days"
    },
    {
      metric: "hrv",
      threshold: "< baseline - 15%",
      duration: "3+ days"
    }
  ];
  outcome: "Performance likely to decline in 3-7 days";
  recommendation: "Reduce volume 30-40% and prioritize sleep";
  confidence: 0.82;
}
```

**Injury Risk Patterns:**
```typescript
interface InjuryRiskPattern {
  pattern_id: string;
  pattern_name: "Volume Spike + Poor Recovery = Knee Injury Risk";
  indicators: [
    {
      metric: "running_volume",
      threshold: "increased >25% vs 4-week average",
      timeframe: "last 7 days"
    },
    {
      metric: "recovery_score",
      threshold: "< 60",
      duration: "4+ days"
    },
    {
      metric: "sleep_hours",
      threshold: "< 7 hours",
      duration: "3+ nights"
    }
  ];
  injury_type: "knee_pain";
  historical_occurrences: 3; // This pattern preceded 3 previous injuries
  risk_score: 0.74;
  recommendation: "Reduce running volume 40% this week, add mobility work";
}
```

**Optimal Performance Patterns:**
```typescript
interface OptimalPerformancePattern {
  pattern_name: "Your Best Leg Days";
  conditions: [
    {
      metric: "sleep_hours",
      value: "> 8 hours",
      importance: 0.9
    },
    {
      metric: "carbs_previous_day",
      value: "> 250g",
      importance: 0.85
    },
    {
      metric: "days_since_last_leg_workout",
      value: "3-4 days",
      importance: 0.8
    },
    {
      metric: "hrv",
      value: "> personal baseline + 5%",
      importance: 0.75
    }
  ];
  outcome: "Volume 15-20% higher than average";
  frequency_observed: "8 out of 10 times";
  recommendation: "Schedule leg days when these conditions align";
}
```

---

### 3. Causal Inference

**Determine if relationships are causal or merely correlated.**

#### Granger Causality Analysis:
Does X cause Y, or do they just correlate?

```python
# Example: Does low protein intake CAUSE slower recovery?
# Or do they just happen together due to a third factor (e.g., busy schedule)?

from statsmodels.tsa.stattools import grangercausalitytests

# Test if protein intake Granger-causes HRV changes
data = pd.DataFrame({
    'protein_intake': user_protein_history,
    'hrv': user_hrv_history
})

# Lag of 1-3 days (protein today affects recovery in 1-3 days)
results = grangercausalitytests(data[['hrv', 'protein_intake']], maxlag=3)
```

#### Interventional Analysis:
"When you increased protein from 120g to 160g for 2 weeks, your recovery score improved by 12 points. Causation likely."

---

### 4. Predictive Modeling

**Use ML to predict future outcomes based on current behavior.**

#### Predictive Models:

**1. Injury Risk Prediction:**
```typescript
interface InjuryRiskPrediction {
  user_id: string;
  prediction_date: Date;
  risk_score: number; // 0-1 (0.75 = 75% risk)
  injury_type_most_likely: string; // "knee_pain", "shoulder_strain", etc.
  time_horizon: string; // "within 7 days"
  
  contributing_factors: [
    { factor: "volume_spike", weight: 0.35 },
    { factor: "poor_sleep", weight: 0.28 },
    { factor: "low_hrv", weight: 0.22 },
    { factor: "insufficient_protein", weight: 0.15 }
  ];
  
  preventive_actions: [
    "Reduce training volume 30% this week",
    "Prioritize 8+ hours sleep",
    "Increase protein to 160g/day",
    "Add extra mobility work for knees"
  ];
  
  model_confidence: 0.78;
}
```

**2. Performance Prediction:**
```typescript
interface PerformancePrediction {
  workout_type: "leg_day";
  scheduled_date: Date;
  predicted_volume: number; // kg
  predicted_performance: "below_average" | "average" | "above_average" | "PR_possible";
  confidence: number;
  
  factors_considered: [
    { factor: "sleep_last_night", impact: "+10%" },
    { factor: "days_since_last_leg_workout", impact: "+5%" },
    { factor: "carb_intake_yesterday", impact: "-8%" }, // Below optimal
    { factor: "hrv_today", impact: "+3%" }
  ];
  
  recommendation: "Consider pushing leg day to tomorrow if you can increase carbs today";
}
```

**3. Nutrition Optimization:**
```typescript
interface NutritionOptimization {
  goal: "maximize_strength_gains";
  current_nutrition: {
    calories: 2400,
    protein: 140,
    carbs: 250,
    fat: 80
  };
  
  predicted_outcomes_if_unchanged: {
    strength_gain_rate: "+2% per month",
    recovery_quality: "average",
    injury_risk: "low"
  };
  
  optimized_nutrition: {
    calories: 2600,
    protein: 165,
    carbs: 300,
    fat: 75
  };
  
  predicted_outcomes_if_optimized: {
    strength_gain_rate: "+3.5% per month",
    recovery_quality: "above_average",
    injury_risk: "low"
  };
  
  explanation: "Your data shows strength gains plateau when protein drops below 160g. Current 140g is limiting recovery.";
  evidence: "Based on 6 months of your data: 23 weeks with protein >160g averaged 4.2% volume increase vs 1.8% when <140g.";
}
```

---

### 5. Anomaly Detection

**Flag unusual patterns that might indicate problems.**

#### Anomaly Types:

**Performance Anomalies:**
```typescript
interface PerformanceAnomaly {
  detected_date: Date;
  anomaly_type: "sudden_performance_drop";
  metric: "squat_volume";
  expected_value: 8500; // kg
  actual_value: 6800; // kg
  deviation: -20%; // 20% below expected
  
  severity: "high";
  
  possible_causes: [
    {
      cause: "illness",
      likelihood: 0.45,
      evidence: "Resting HR elevated 8 bpm, HRV down 22%"
    },
    {
      cause: "poor_nutrition",
      likelihood: 0.35,
      evidence: "Calories 30% below normal last 3 days, protein only 90g yesterday"
    },
    {
      cause: "inadequate_recovery",
      likelihood: 0.20,
      evidence: "Sleep quality <60 for 4 days, recovery score 45"
    }
  ];
  
  recommendation: "Take an extra rest day and focus on nutrition/sleep. If performance doesn't recover in 3 days, consider a deload week.";
}
```

**Recovery Anomalies:**
```typescript
interface RecoveryAnomaly {
  detected_date: Date;
  anomaly_type: "hrv_sudden_drop";
  metric: "hrv_ms";
  personal_baseline: 65;
  current_value: 42;
  deviation: -35%;
  
  duration: "3 consecutive days";
  
  correlation_analysis: [
    {
      factor: "training_volume",
      correlation: -0.72,
      note: "Volume increased 45% this week"
    },
    {
      factor: "sleep_quality",
      correlation: +0.65,
      note: "Sleep quality dropped to 55 (avg: 78)"
    },
    {
      factor: "alcohol_consumption",
      correlation: -0.58,
      note: "2 drinks detected 2 nights ago"
    }
  ];
  
  action_required: "URGENT - High overtraining risk. Recommend immediate deload.";
}
```

---

## AI/ML Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                   DATA INGESTION LAYER                       │
│  • Apple Health Sync                                         │
│  • Terra API Sync                                            │
│  • VoiceFit Workout Logs                                     │
│  • Manual Entries                                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                DATA PREPROCESSING LAYER                      │
│  • Data Cleaning (remove outliers, fix errors)              │
│  • Feature Engineering (derive metrics)                      │
│  • Normalization (scale values)                              │
│  • Time-series alignment (sync data by timestamp)            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ML PIPELINE LAYER                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Model 1: Correlation Engine                         │  │
│  │  • Pearson correlation                               │  │
│  │  • Spearman rank correlation                         │  │
│  │  • Time-lagged correlation                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Model 2: Pattern Recognition                        │  │
│  │  • Clustering (K-means, DBSCAN)                      │  │
│  │  • Sequence mining (frequent patterns)               │  │
│  │  • Anomaly detection (Isolation Forest)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Model 3: Injury Risk Predictor                      │  │
│  │  • Random Forest Classifier                          │  │
│  │  • XGBoost                                           │  │
│  │  • Input: 30-day rolling features                   │  │
│  │  • Output: Injury probability (next 7 days)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Model 4: Performance Predictor                      │  │
│  │  • LSTM (time-series forecasting)                   │  │
│  │  • Gradient Boosting Regressor                      │  │
│  │  • Input: 14-day window                             │  │
│  │  • Output: Expected performance next workout        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Model 5: Nutrition Optimizer                        │  │
│  │  • Bayesian Optimization                            │  │
│  │  • Multi-objective optimization                     │  │
│  │  • Constraints: health ranges, user preferences     │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               INSIGHT GENERATION LAYER                       │
│  • Natural language generation (GPT-4)                       │
│  • Insight ranking (by importance)                           │
│  • Confidence scoring                                        │
│  • Actionable recommendations                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DELIVERY LAYER                              │
│  • In-app insights feed                                      │
│  • Push notifications (high-priority insights)               │
│  • Weekly summary emails                                     │
│  • AI Coach conversational interface                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Data Processing:**
- Python 3.11+ (pandas, numpy)
- Apache Airflow (workflow orchestration)
- PostgreSQL (TimescaleDB extension for time-series)

**ML Framework:**
- scikit-learn (correlation, clustering, classification)
- XGBoost / LightGBM (gradient boosting)
- TensorFlow / PyTorch (deep learning, LSTM)
- statsmodels (time-series analysis, Granger causality)

**ML Ops:**
- MLflow (experiment tracking, model registry)
- DVC (data version control)
- Weights & Biases (monitoring)

**NLG (Natural Language Generation):**
- OpenAI GPT-4 (generate human-readable insights)
- Custom prompt templates

**Infrastructure:**
- AWS SageMaker / Google Vertex AI (model training)
- Docker (containerization)
- Kubernetes (orchestration)
- Redis (caching for real-time predictions)

---

## Database Design

### Core Tables

```sql
-- User health data snapshot (denormalized for ML)
CREATE TABLE user_health_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    
    -- Nutrition (past 24h)
    calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fat_g INTEGER,
    water_ml INTEGER,
    
    -- Strength (if workout occurred)
    workout_occurred BOOLEAN,
    total_volume_kg INTEGER,
    avg_intensity_pct NUMERIC, -- % of 1RM
    muscle_groups_trained TEXT[],
    workout_duration_min INTEGER,
    
    -- Cardio (if workout occurred)
    cardio_occurred BOOLEAN,
    cardio_distance_km NUMERIC,
    cardio_duration_min INTEGER,
    avg_heart_rate INTEGER,
    avg_pace_sec_per_km NUMERIC,
    
    -- Biometrics
    sleep_hours NUMERIC,
    sleep_quality_score INTEGER,
    hrv_ms INTEGER,
    resting_hr INTEGER,
    recovery_score INTEGER,
    
    -- Body
    weight_kg NUMERIC,
    body_fat_pct NUMERIC,
    
    -- Injury status
    active_injuries TEXT[],
    pain_level INTEGER, -- 0-10
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_health_snapshots_user_date ON user_health_snapshots(user_id, date DESC);

-- Discovered correlations
CREATE TABLE ai_correlations (
    correlation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    variable_x TEXT NOT NULL, -- e.g., "protein_intake"
    variable_y TEXT NOT NULL, -- e.g., "squat_volume"
    correlation_coefficient NUMERIC NOT NULL, -- -1 to 1
    p_value NUMERIC, -- statistical significance
    sample_size INTEGER, -- number of data points
    time_lag_days INTEGER, -- X affects Y after N days
    
    -- Context
    date_range_start DATE,
    date_range_end DATE,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    strength TEXT CHECK (strength IN ('weak', 'moderate', 'strong', 'very_strong')),
    is_statistically_significant BOOLEAN,
    confidence_level NUMERIC, -- 0-1
    
    UNIQUE(user_id, variable_x, variable_y, time_lag_days)
);

-- Discovered patterns
CREATE TABLE ai_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'performance_decline',
        'optimal_performance',
        'injury_risk',
        'recovery_issue',
        'nutrition_deficiency'
    )),
    pattern_name TEXT NOT NULL,
    pattern_description TEXT,
    
    -- Conditions (as JSON)
    conditions JSONB NOT NULL,
    
    -- Outcomes
    outcome_metric TEXT,
    outcome_impact TEXT, -- e.g., "+15% volume", "-20% risk"
    
    -- Frequency
    times_observed INTEGER DEFAULT 1,
    last_observed_date DATE,
    
    -- Confidence
    confidence_score NUMERIC, -- 0-1
    statistical_significance NUMERIC, -- p-value
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions
CREATE TABLE ai_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'injury_risk',
        'performance_forecast',
        'nutrition_optimization',
        'recovery_forecast'
    )),
    prediction_date DATE NOT NULL, -- when prediction was made
    prediction_horizon_days INTEGER, -- predicting N days ahead
    
    -- Prediction
    prediction_value NUMERIC,
    prediction_category TEXT, -- e.g., "high_risk", "above_average"
    confidence NUMERIC, -- 0-1
    
    -- Factors
    contributing_factors JSONB,
    
    -- Recommendations
    recommendations TEXT[],
    
    -- Validation (did it come true?)
    actual_outcome TEXT,
    was_correct BOOLEAN,
    validated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_user_date ON ai_predictions(user_id, prediction_date DESC);

-- Generated insights (user-facing)
CREATE TABLE ai_insights (
    insight_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'correlation',
        'pattern',
        'prediction',
        'anomaly',
        'recommendation'
    )),
    
    -- Content
    title TEXT NOT NULL, -- e.g., "Protein intake affects your recovery"
    description TEXT NOT NULL, -- detailed explanation
    insight_category TEXT, -- 'positive', 'negative', 'neutral'
    
    -- Priority
    importance_score NUMERIC, -- 0-1 (how important is this?)
    actionable BOOLEAN DEFAULT false, -- can user do something about it?
    
    -- Actions
    recommended_actions TEXT[],
    
    -- Supporting data
    evidence JSONB, -- charts, data points
    related_correlation_id UUID REFERENCES ai_correlations(correlation_id),
    related_pattern_id UUID REFERENCES ai_patterns(pattern_id),
    related_prediction_id UUID REFERENCES ai_predictions(prediction_id),
    
    -- User interaction
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    user_feedback TEXT, -- 'helpful', 'not_helpful', 'already_knew'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- insights can expire if no longer relevant
);

CREATE INDEX idx_insights_user_unread ON ai_insights(user_id, is_read, created_at DESC);
CREATE INDEX idx_insights_importance ON ai_insights(user_id, importance_score DESC);

-- Model performance tracking
CREATE TABLE ml_model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    metric_name TEXT NOT NULL, -- 'accuracy', 'precision', 'rmse', etc.
    metric_value NUMERIC NOT NULL,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    dataset_size INTEGER,
    notes TEXT
);
```

---

## Example Insights

### Example 1: Protein & Recovery Correlation

**Insight Generated:**
```json
{
  "insight_id": "abc123",
  "title": "Your protein intake strongly affects recovery",
  "description": "Based on 4 months of your data, we found that when you consume 160g+ protein per day, your HRV recovers 18% faster after hard workouts compared to days with <140g protein.",
  "insight_category": "positive",
  "importance_score": 0.88,
  "actionable": true,
  
  "evidence": {
    "correlation_coefficient": 0.74,
    "p_value": 0.003,
    "sample_size": 87,
    "chart_data": {
      "x_axis": "protein_intake_g",
      "y_axis": "hrv_recovery_speed",
      "data_points": [
        {"protein": 120, "hrv_recovery_days": 2.8},
        {"protein": 140, "hrv_recovery_days": 2.3},
        {"protein": 160, "hrv_recovery_days": 1.8},
        {"protein": 180, "hrv_recovery_days": 1.7}
      ]
    }
  },
  
  "recommended_actions": [
    "Aim for 160-180g protein daily, especially after hard workouts",
    "Track protein intake for next 2 weeks to validate this pattern",
    "Consider protein timing: 40g within 2 hours post-workout"
  ],
  
  "user_facing_message": "💡 **Discovery: Protein Powers Your Recovery**\n\nWe analyzed 87 workouts over 4 months and found something interesting: your HRV bounces back 18% faster when you eat 160g+ protein versus <140g.\n\n📊 The data:\n- <140g protein → 2.8 days to recover HRV\n- 160g+ protein → 1.8 days to recover HRV\n\n✅ **Action:** Aim for 160-180g protein daily, especially after intense sessions."
}
```

---

### Example 2: Volume Spike → Injury Risk Pattern

**Insight Generated:**
```json
{
  "insight_id": "def456",
  "title": "⚠️ High injury risk detected - Volume spike pattern",
  "description": "Your running volume increased 38% this week while your recovery score dropped below 60 for 4 days. This pattern has preceded knee injuries 3 times in your history.",
  "insight_category": "negative",
  "importance_score": 0.94,
  "actionable": true,
  
  "pattern_detected": {
    "pattern_name": "Volume Spike + Poor Recovery = Knee Injury",
    "historical_accuracy": "3 out of 3 times (100%)",
    "current_indicators": [
      {
        "metric": "running_volume",
        "status": "⚠️ +38% vs 4-week average",
        "threshold_crossed": true
      },
      {
        "metric": "recovery_score",
        "status": "⚠️ <60 for 4 days",
        "threshold_crossed": true
      },
      {
        "metric": "sleep_hours",
        "status": "⚠️ 6.2 hours avg (need 7+)",
        "threshold_crossed": true
      }
    ]
  },
  
  "risk_assessment": {
    "injury_probability": 0.74,
    "time_window": "next 7 days",
    "most_likely_injury": "knee_pain",
    "confidence": 0.89
  },
  
  "recommended_actions": [
    "🛑 URGENT: Reduce running volume 40% this week",
    "😴 Prioritize 8+ hours sleep for next 3 nights",
    "🧘 Add daily knee mobility/prehab work",
    "📊 Monitor knee discomfort closely - stop if pain >3/10"
  ],
  
  "user_facing_message": "⚠️ **High Injury Risk Alert**\n\nYour current training pattern has preceded knee injuries 3 times before:\n\n📈 Running volume: +38% (too much, too fast)\n😴 Recovery score: <60 for 4 days\n💤 Sleep: Only 6.2 hours avg\n\n🎯 **Injury risk: 74% in next 7 days**\n\n**Take action now:**\n1. Cut running 40% this week\n2. Get 8+ hours sleep tonight\n3. Add knee mobility work daily\n\nYour past data shows this WORKS - acting early prevented issues before."
}
```

---

### Example 3: Carb Timing Optimization

**Insight Generated:**
```json
{
  "insight_id": "ghi789",
  "title": "Your best leg days share a common pattern",
  "description": "We analyzed your 15 best leg workouts (volume >9000kg). They all had 3 things in common: 250g+ carbs the day before, 8+ hours sleep, and 3-4 days rest since last leg session.",
  "insight_category": "positive",
  "importance_score": 0.81,
  "actionable": true,
  
  "pattern_analysis": {
    "outcome_metric": "leg_workout_volume",
    "best_performances": [
      {"date": "2024-12-10", "volume": 9500, "conditions_met": 3},
      {"date": "2024-12-03", "volume": 9200, "conditions_met": 3},
      {"date": "2024-11-26", "volume": 9400, "conditions_met": 3}
    ],
    "average_performances": [
      {"date": "2024-12-17", "volume": 7800, "conditions_met": 1},
      {"date": "2024-11-19", "volume": 7500, "conditions_met": 2}
    ],
    
    "optimal_conditions": [
      {
        "condition": "carbs_previous_day > 250g",
        "importance": 0.89,
        "met_in_best_workouts": "15/15 (100%)",
        "met_in_average_workouts": "6/20 (30%)"
      },
      {
        "condition": "sleep_hours > 8",
        "importance": 0.85,
        "met_in_best_workouts": "14/15 (93%)",
        "met_in_average_workouts": "7/20 (35%)"
      },
      {
        "condition": "days_since_last_leg = 3-4",
        "importance": 0.78,
        "met_in_best_workouts": "15/15 (100%)",
        "met_in_average_workouts": "11/20 (55%)"
      }
    ]
  },
  
  "prediction": {
    "next_scheduled_leg_day": "2025-01-28",
    "conditions_met": 2,
    "missing_conditions": ["carbs_yesterday only 180g (need 250g+)"],
    "predicted_performance": "average",
    "recommendation": "Increase carbs today to 250g+ for optimal performance tomorrow"
  },
  
  "user_facing_message": "🎯 **Unlock Your Best Leg Days**\n\nWe found the recipe for your peak leg performance:\n\n✅ 250g+ carbs the day before (you're at 180g today)\n✅ 8+ hours sleep (✓ you're averaging 8.2h)\n✅ 3-4 days since last leg workout (✓ it's been 3 days)\n\n📊 When you hit all 3 conditions:\n- Average volume: 9,300kg\n- When you miss 1-2: 7,650kg (-18%)\n\n💡 **Action for tomorrow's leg day:**\nAdd 70g carbs today (rice, potatoes, oats). Your data shows this simple change can boost volume by 15-20%."
}
```

---

### Example 4: Sleep Quality → Cardio Performance

**Insight Generated:**
```json
{
  "insight_id": "jkl012",
  "title": "Poor sleep is killing your running pace",
  "description": "After nights with <7 hours sleep, your running pace at the same heart rate is 6.8% slower. This has been consistent across 34 runs.",
  "insight_category": "negative",
  "importance_score": 0.76,
  "actionable": true,
  
  "correlation_details": {
    "variable_x": "sleep_duration_hours",
    "variable_y": "pace_at_150bpm",
    "correlation_coefficient": -0.68,
    "interpretation": "Strong negative correlation (less sleep = slower pace)",
    "sample_size": 34,
    "p_value": 0.001
  },
  
  "performance_comparison": {
    "after_good_sleep": {
      "sleep_hours": ">8",
      "avg_pace_at_150bpm": "5:12 /km",
      "runs_analyzed": 12
    },
    "after_ok_sleep": {
      "sleep_hours": "7-8",
      "avg_pace_at_150bpm": "5:24 /km",
      "runs_analyzed": 14
    },
    "after_poor_sleep": {
      "sleep_hours": "<7",
      "avg_pace_at_150bpm": "5:34 /km",
      "runs_analyzed": 8,
      "performance_drop": "6.8% slower than after good sleep"
    }
  },
  
  "recommended_actions": [
    "Prioritize 8+ hours sleep before key running workouts",
    "If you slept poorly, adjust pace expectations or make it an easy day",
    "Consider sleep quality supplements (magnesium, melatonin) if struggling"
  ],
  
  "user_facing_message": "😴 **Sleep Is Your Secret Weapon**\n\nYour data reveals a clear pattern across 34 runs:\n\n🛌 8+ hours sleep → 5:12/km pace @ 150bpm\n😐 7-8 hours sleep → 5:24/km pace @ 150bpm\n😫 <7 hours sleep → 5:34/km pace @ 150bpm\n\n📉 That's a 6.8% performance drop with poor sleep!\n\n💡 **This week:**\nYou have a tempo run Wednesday. You slept only 6.5 hours last night. Consider:\n- Making it an easy run instead, OR\n- Adjusting pace expectations (run by feel, not pace)\n\nYour body performs best on 8+ hours - plan accordingly!"
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
**Prerequisites:** Wearable integration complete, nutrition data flowing

**Goals:**
- Build data pipeline for aggregating all health data
- Create unified health snapshot table
- Implement basic correlation engine

**Deliverables:**
1. **Data Pipeline** (Weeks 1-4)
   - ETL jobs to aggregate Apple Health, Terra API, workout logs
   - Daily health snapshot generation
   - Data quality checks and cleaning

2. **Correlation Engine** (Weeks 5-8)
   - Statistical correlation analysis (Pearson, Spearman)
   - Time-lagged correlation (X today affects Y tomorrow)
   - Correlation significance testing
   - Store results in `ai_correlations` table

3. **Basic Insights UI** (Weeks 9-12)
   - Simple insights feed in app
   - Display top 3 correlations for user
   - Basic visualization (scatter plots)

**Success Metrics:**
- Pipeline processes 100% of user data daily
- Identify 5+ statistically significant correlations per user
- 60% of users check insights tab weekly

**Budget:** $60K-80K (1 ML engineer, 1 backend dev)

---

### Phase 2: Pattern Recognition (Months 4-6)

**Goals:**
- Detect recurring patterns in user data
- Implement anomaly detection
- Begin predicting outcomes

**Deliverables:**
1. **Pattern Mining** (Weeks 13-16)
   - K-means clustering for behavior patterns
   - Sequence mining for recurring event chains
   - Pattern storage in `ai_patterns` table

2. **Anomaly Detection** (Weeks 17-20)
   - Isolation Forest for outlier detection
   - Alert system for unusual patterns
   - Performance/recovery anomaly flagging

3. **Basic Prediction Models** (Weeks 21-24)
   - Random Forest for injury risk (binary: high/low)
   - Linear regression for performance forecasting
   - Model evaluation and validation

**Success Metrics:**
- Detect 3+ meaningful patterns per user
- Anomaly detection accuracy >85%
- Injury prediction AUC-ROC >0.70

**Budget:** $80K-100K (1 ML engineer, 1 data scientist)

---

### Phase 3: Advanced ML Models (Months 7-12)

**Goals:**
- Sophisticated prediction models
- Causal inference analysis
- Personalized nutrition optimization

**Deliverables:**
1. **Advanced Prediction Models** (Weeks 25-32)
   - XGBoost for multi-class injury prediction
   - LSTM for time-series performance forecasting
   - Ensemble models for improved accuracy

2. **Causal Inference** (Weeks 33-40)
   - Granger causality testing
   - Interventional analysis ("what if" scenarios)
   - Differentiate correlation from causation

3. **Nutrition Optimizer** (Weeks 41-48)
   - Bayesian optimization for macro targets
   - Multi-objective optimization (performance + body comp)
   - Personalized recommendations

**Success Metrics:**
- Injury prediction AUC-ROC >0.80
- Performance forecast within ±10% actual
- 70% of nutrition recommendations followed

**Budget:** $120K-150K (1 senior ML engineer, 1 data scientist, MLOps support)

---

### Phase 4: NLG & Polish (Months 13-18)

**Goals:**
- Natural language insight generation
- Conversational AI coach
- Production-ready system

**Deliverables:**
1. **Natural Language Generation** (Weeks 49-56)
   - GPT-4 integration for insight explanations
   - Personalized tone and language
   - Context-aware recommendations

2. **AI Coach Interface** (Weeks 57-64)
   - Conversational insights via chat
   - Proactive suggestions
   - Adaptive learning from user feedback

3. **MLOps & Monitoring** (Weeks 65-72)
   - Automated model retraining
   - A/B testing framework
   - Performance monitoring dashboard

**Success Metrics:**
- 85% insight clarity rating from users
- 50% of users engage with AI coach weekly
- Model accuracy maintained >80% over time

**Budget:** $100K-130K (ML engineer, backend dev, product manager)

---

## Technical Challenges

### Challenge 1: Data Quality & Completeness

**Problem:**
- Users don't track consistently (gaps in data)
- Nutrition apps have varying accuracy
- Biometric devices can be unreliable

**Solution:**
- Minimum data requirements for analysis (e.g., 30 days of data)
- Confidence intervals on all predictions
- Flag low-quality data points
- Use imputation carefully (or skip analysis if too many gaps)

---

### Challenge 2: Individual Variability

**Problem:**
- What works for User A may not work for User B
- Need sufficient data per user before personalizing

**Solution:**
- Start with population-level insights (first 30 days)
- Transition to personalized after 60+ days of data
- Continuous learning - models improve as data accumulates
- Meta-learning across users with similar profiles

---

### Challenge 3: Causation vs Correlation

**Problem:**
- Correlation doesn't imply causation
- Risk of spurious correlations

**Solution:**
- Use Granger causality tests
- Require multiple occurrences before claiming pattern
- Longitudinal analysis (track over time)
- Clear communication: "correlation" vs "causation" in UI
- Interventional experiments (recommend change, measure outcome)

---

### Challenge 4: Cold Start Problem

**Problem:**
- New users have no historical data
- Can't generate insights immediately

**Solution:**
- Use population-level insights for first 30 days
- Accelerate data collection (onboarding surveys)
- Transfer learning from similar users
- Focus on data collection prompts early on

---

### Challenge 5: Computational Cost

**Problem:**
- ML models are expensive to train/run
- Real-time predictions for 10K+ users = costly

**Solution:**
- Batch processing (run models overnight)
- Cache predictions (don't recalculate unnecessarily)
- Tiered system: basic insights (free), advanced (premium)
- Progressive model complexity (simple first, complex later)

---

## Success Metrics

### User Engagement Metrics

| Metric | Target (Phase 1) | Target (Phase 4) |
|--------|------------------|------------------|
| % users viewing insights weekly | 60% | 80% |
| Avg time on insights page | 2 min | 5 min |
| % users acting on recommendations | 30% | 60% |
| % users providing feedback | 20% | 40% |

### AI Performance Metrics

| Metric | Target (Phase 1) | Target (Phase 4) |
|--------|------------------|------------------|
| Correlation detection accuracy | 75% | 85% |
| Injury prediction AUC-ROC | N/A | 0.80+ |
| Performance forecast RMSE | N/A | ±10% |
| Pattern detection precision | 70% | 85% |

### Business Metrics

| Metric | Target |
|--------|--------|
| Premium conversion rate (free → paid) | +15% |
| User retention (90-day) | +25% |
| NPS score increase | +20 points |
| Revenue from AI features | $100K+ ARR by Month 18 |

---

## Privacy & Ethics

### Data Privacy Principles

1. **User Control**
   - Users can disable AI analysis anytime
   - All insights can be hidden/deleted
   - Raw data never leaves device without consent

2. **Transparency**
   - Explain how insights are generated
   - Show confidence levels clearly
   - Never claim certainty where there is none

3. **Security**
   - Encrypt all health data (at rest and in transit)
   - Anonymize data for aggregate analysis
   - GDPR/CCPA compliant

4. **No Discrimination**
   - Models trained without bias toward demographics
   - Equal quality insights for all users
   - Regular bias audits

### Ethical Guidelines

**DO:**
✅ Empower users with data-driven insights  
✅ Warn about potential risks (injury, overtraining)  
✅ Recommend conservative actions when uncertain  
✅ Encourage professional medical advice when needed  

**DON'T:**
❌ Make medical diagnoses (we're not doctors)  
❌ Shame users for poor metrics  
❌ Sell or share user health data  
❌ Use dark patterns to push premium features  

### Medical Disclaimer

**Required in app:**
> "VoiceFit AI Insights are educational only and do not constitute medical advice. Consult a healthcare professional for medical concerns. Predictions are probabilistic and may be incorrect."

---

## Conclusion

The **AI Health Intelligence Engine** represents VoiceFit's evolution from a workout logging app to a comprehensive health intelligence platform. By connecting nutrition, performance, recovery, and injury data, we can deliver insights no other app provides.

**Key Differentiators:**
1. **Only app integrating nutrition + strength + cardio + biometrics**
2. **AI discovers what humans miss** (hidden correlations)
3. **Predictive, not just descriptive** (anticipate problems before they occur)
4. **Personalized to YOU** (not generic advice)

**Timeline:** 18 months from Phase 1 kickoff  
**Investment:** $360K-460K total  
**Expected Return:** 15% premium conversion lift, 25% retention boost, $100K+ ARR

**Next Steps:**
1. Complete wearable integration (prerequisite)
2. Hire ML engineer with health tech experience
3. Begin Phase 1 data pipeline development
4. Launch beta program with 100 power users

---

**Document Owner:** AI/ML Team  
**Last Updated:** 2025-01-24  
**Status:** Approved for Development Planning  
**Next Review:** After Phase 1 completion

---

## Appendix: Related Documents

- [COMPREHENSIVE_FEATURE_PLANNING.md](./COMPREHENSIVE_FEATURE_PLANNING.md) - Overall roadmap
- [NUTRITION_API_ANALYSIS.md](./NUTRITION_API_ANALYSIS.md) - Nutrition data integration
- [FUTURE_PLANS.md](./FUTURE_PLANS.md) - Long-term vision