# Voice Fit - Frontend Technical Specification
**For UI/UX Development Teams**

**Version:** 1.0  
**Date:** November 5, 2025  
**Project:** Voice Fit - Voice-First Fitness Tracking iOS App  
**Backend Status:** ✅ Production Ready (95.57% accuracy, 456 exercises, 100% test coverage)

---

## 📋 Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Core Features & Functionality](#2-core-features--functionality)
3. [Database Schema & Data Models](#3-database-schema--data-models)
4. [API Integration Guide](#4-api-integration-guide)
5. [User Flow & Screen Requirements](#5-user-flow--screen-requirements)
6. [Voice Interaction UX Specifications](#6-voice-interaction-ux-specifications)
7. [Technical Implementation Notes](#7-technical-implementation-notes)
8. [Data Synchronization](#8-data-synchronization)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React Native)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  iOS App     │  │  Web (Test)  │  │  Components  │      │
│  │  (Production)│  │  (localhost) │  │  (Shared)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                            ▼                                 │
│              ┌──────────────────────────┐                    │
│              │   Platform Abstraction   │                    │
│              │  - Voice Service         │                    │
│              │  - Database Service      │                    │
│              │  - Storage Service       │                    │
│              └──────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  FastAPI     │  │  Supabase    │  │  Upstash     │      │
│  │  (Voice API) │  │  (Database)  │  │  (Cache)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  GPT-4o-mini │  │  PostgreSQL  │  │  Search      │      │
│  │  Fine-tuned  │  │  + pgvector  │  │  Index       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Backend Infrastructure

#### **1.2.1 Supabase Database**
- **Project ID:** `szragdskusayriycfhrs`
- **Region:** US-East-1
- **Database:** PostgreSQL 17 with pgvector extension
- **Purpose:** Primary data store for exercises, workouts, users, voice commands
- **Connection:** Direct (web), WatermelonDB sync (iOS)

#### **1.2.2 OpenAI Fine-Tuned Model**
- **Model ID:** `ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G`
- **Base Model:** GPT-4o-mini-2024-07-18
- **Training Data:** 3,890 examples (3,850 original + 40 YouTube terminology)
- **Accuracy:** 95.57% weight, 99.74% reps, 98.18% RPE
- **Purpose:** Parse natural language voice commands into structured workout data

#### **1.2.3 Upstash Search Cache**
- **Index Name:** "exercises"
- **Documents:** 456 exercises with synonyms
- **Purpose:** Fast exercise name matching (50-100ms latency)
- **Strategy:** Hybrid full-text + semantic search
- **Confidence Threshold:** 0.8 minimum (80%)

#### **1.2.4 FastAPI Backend**
- **Host:** `http://localhost:8000` (development)
- **Production:** TBD (will be deployed to cloud)
- **Endpoints:** `/api/voice/parse`, `/health`, `/api/session/*`
- **Authentication:** JWT tokens (Supabase Auth)
- **CORS:** Configured for localhost (dev) and iOS app (production)

### 1.3 Data Flow: Voice Input → Database Storage

```
1. USER SPEAKS
   "Bench press 225 for 8 at RPE 8"
   │
   ▼
2. APPLE SPEECH FRAMEWORK (iOS) / KEYBOARD (Web)
   Converts speech → text transcript
   │
   ▼
3. FRONTEND: VoiceAPIClient.parseVoiceCommand()
   POST /api/voice/parse
   {
     "transcript": "Bench press 225 for 8 at RPE 8",
     "user_id": "uuid",
     "auto_save": true
   }
   │
   ▼
4. BACKEND: Fine-Tuned GPT-4o-mini Model
   Extracts structured data:
   {
     "exercise_name": "Barbell Bench Press",
     "weight": 225,
     "weight_unit": "lbs",
     "reps": 8,
     "rpe": 8
   }
   │
   ▼
5. BACKEND: Validation Layer
   - Removes hallucinated weights for bodyweight exercises
   - Validates realistic values
   │
   ▼
6. BACKEND: Upstash Search
   Matches "Barbell Bench Press" → exercise_id (UUID)
   Confidence: 0.95 (95%)
   │
   ▼
7. BACKEND: Response to Frontend
   {
     "success": true,
     "action": "auto_accept",  // ≥85% confidence
     "confidence": 0.95,
     "data": {
       "exercise_id": "uuid",
       "exercise_name": "Barbell Bench Press",
       "weight": 225,
       "reps": 8,
       "rpe": 8
     }
   }
   │
   ▼
8. FRONTEND: Confidence-Based UX
   - High (≥85%): Auto-accept, show brief confirmation
   - Medium (70-85%): Show confirmation sheet, require tap
   - Low (<70%): Show error, ask to retry
   │
   ▼
9. FRONTEND: Save to Database
   - Web: Direct Supabase insert
   - iOS: WatermelonDB insert → sync to Supabase
   │
   ▼
10. DATABASE: workout_logs table
    Stores completed set with all metadata
```

### 1.4 Authentication & Session Management

#### **Authentication Flow**
```
1. User signs up/logs in via Supabase Auth
   ↓
2. Supabase returns JWT token
   ↓
3. Frontend stores token in secure storage
   - Web: localStorage (dev only)
   - iOS: Keychain
   ↓
4. All API requests include Authorization header:
   "Authorization: Bearer <jwt_token>"
   ↓
5. Backend verifies JWT signature
   ↓
6. Request proceeds with user_id from token
```

#### **Session Management**
- **Session ID Format:** `session_{user_id}_{unix_timestamp}`
- **Session Start:** First voice command creates session
- **Session Context:** Tracks current exercise, set number, total sets
- **Session End:** User taps "End Workout" → generates summary
- **Session Storage:** In-memory (backend) + database (persistent)

---

## 2. Core Features & Functionality

### 2.1 Program Building

**Status:** ⚠️ Not yet implemented (Phase 7 feature)

**Planned Functionality:**
- Create custom workout programs
- Select exercises from 456-exercise database
- Define sets, reps, weight progression schemes
- Schedule programs (e.g., "Upper/Lower 4x/week")
- Auto-regulation based on RPE/RIR

**Database Tables:**
- `workout_programs` - Program metadata
- `program_exercises` - Exercises in program
- `program_schedules` - Weekly schedule

### 2.2 Workout Logging (CORE FEATURE - IMPLEMENTED)

**Primary User Flow:**
1. User taps "START" tab
2. Selects workout program (or "Quick Workout")
3. Taps Voice FAB (floating action button)
4. Speaks: "Bench press 225 for 8 at RPE 8"
5. App shows parsed data with confidence indicator
6. User confirms (if medium confidence) or auto-accepts (high confidence)
7. Set is logged to database
8. Repeat for all sets
9. Tap "End Workout" → see summary

**Voice-First Interaction:**
- **Primary Input:** Voice (Apple Speech Framework on iOS)
- **Fallback:** Keyboard (web testing only)
- **Real-Time Parsing:** <3s from speech → confirmed log
- **Visual Feedback:** Immediate confirmation UI

**Set/Rep/Weight Tracking:**
- **Weight:** Decimal (e.g., 225.5 lbs)
- **Reps:** Integer (e.g., 8)
- **RPE:** 1-10 scale (Rate of Perceived Exertion)
- **RIR:** 0-10 scale (Reps in Reserve) - calculated from RPE
- **Tempo:** Optional (e.g., "3010")
- **Rest:** Optional (seconds between sets)
- **Notes:** Optional free-text

### 2.3 Voice Interaction System

**Speech Recognition (iOS):**
- **Framework:** Apple Speech Framework (`expo-speech`)
- **Language:** English (US)
- **Accuracy Target:** >90% quiet, >75% gym noise
- **Continuous Listening:** No (tap-to-speak)
- **Timeout:** 5 seconds of silence → auto-stop

**Natural Language Processing:**
- **Backend:** Fine-tuned GPT-4o-mini model
- **Supported Patterns:**
  - Standard: "bench press 225 for 8"
  - With RPE: "bench press 225 for 8 at RPE 8"
  - Abbreviations: "RDL 315 for 5"
  - Equipment: "db rows 80s for 12"
  - Same weight: "same weight for 7"
  - Bodyweight: "pull-ups for 10"

**Command Parsing:**
- **Extraction:** Exercise name, weight, reps, RPE, RIR, tempo, rest
- **Normalization:** "Bench" → "Barbell Bench Press"
- **Validation:** Realistic values, bodyweight exercise handling
- **Confidence Scoring:** 0.0-1.0 (0-100%)

### 2.4 Exercise Parsing Pipeline

```
VOICE TRANSCRIPT
   │
   ▼
FINE-TUNED GPT-4o-mini
   │ Extracts: exercise_name, weight, reps, RPE
   ▼
VALIDATION LAYER
   │ - Removes hallucinated weights for bodyweight exercises
   │ - Validates realistic values (weight, reps, RPE)
   ▼
UPSTASH SEARCH
   │ - Searches 456 exercises with synonyms
   │ - Returns best match with confidence score
   ▼
DATABASE MATCHING
   │ - Maps exercise_name → exercise_id (UUID)
   │ - Fetches exercise metadata (muscles, cues, etc.)
   ▼
RESPONSE TO FRONTEND
   {
     "exercise_id": "uuid",
     "exercise_name": "Barbell Bench Press",
     "weight": 225,
     "reps": 8,
     "rpe": 8,
     "confidence": 0.95
   }
```

### 2.5 Auto-Regulation Features

**RPE Tracking:**
- **Scale:** 1-10 (10 = max effort)
- **Purpose:** Measure workout intensity
- **Usage:** Adjust weight based on RPE trends

**Fatigue Management:**
- **Readiness Check:** Daily questionnaire (sleep, stress, soreness)
- **Auto-Adjustment:** Reduce volume/intensity if fatigued
- **Recovery Tracking:** Days since last workout per muscle group

**Adaptive Programming:**
- **Progressive Overload:** Auto-increase weight when RPE drops
- **Deload Weeks:** Scheduled recovery periods
- **Exercise Substitution:** Suggest alternatives if exercise unavailable

### 2.6 Progress Tracking

**Workout History:**
- **View:** List of past workouts with date, duration, exercises
- **Filter:** By date range, exercise, muscle group
- **Search:** Find specific workouts

**Performance Metrics:**
- **Volume:** Total weight lifted (sets × reps × weight)
- **Intensity:** Average RPE per workout
- **Frequency:** Workouts per week
- **Personal Records:** Max weight, max reps, max volume

**Trend Analysis:**
- **Charts:** Weight progression over time (Victory Native XL)
- **Insights:** "You're 10% stronger than last month"
- **Predictions:** "You'll hit 315 lbs bench in 6 weeks"

---

## 3. Database Schema & Data Models

### 3.1 Core Tables

#### **3.1.1 exercises**
**Purpose:** Core exercise database (456 exercises)

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key |
| `original_name` | VARCHAR(255) | ✅ | Display name (e.g., "Barbell Bench Press") |
| `normalized_name` | VARCHAR(255) | ✅ | Lowercase, no spaces (e.g., "barbellbenchpress") |
| `phonetic_key` | VARCHAR(10) | ✅ | Soundex encoding for voice matching |
| `synonyms` | TEXT[] | ❌ | Array of variations (e.g., ["bench", "bb bench"]) |
| `embedding` | vector(384) | ❌ | Semantic search vector |
| `parent_exercise_id` | UUID | ❌ | Parent exercise (for variations) |
| `movement_pattern` | VARCHAR(50) | ❌ | horizontal_push, squat, hinge, etc. |
| `force` | VARCHAR(20) | ❌ | push, pull, static |
| `level` | VARCHAR(20) | ❌ | beginner, intermediate, advanced |
| `mechanic` | VARCHAR(20) | ❌ | compound, isolation |
| `primary_equipment` | VARCHAR(100) | ❌ | barbell, dumbbell, bodyweight, etc. |
| `category` | VARCHAR(50) | ❌ | strength, cardio, flexibility |
| `created_at` | TIMESTAMP | ✅ | Auto-generated |
| `updated_at` | TIMESTAMP | ✅ | Auto-updated |

**Movement Patterns (14 total):**
- `horizontal_push` (61 exercises) - Bench press, push-ups
- `horizontal_pull` (42) - Rows, face pulls
- `vertical_push` (25) - Overhead press, dips
- `vertical_pull` (30) - Pull-ups, lat pulldowns
- `squat` (39) - Back squat, front squat
- `hinge` (41) - Deadlift, RDL
- `lunge` (25) - Split squat, walking lunge
- `core` (35) - Planks, ab wheel
- `olympic` (29) - Clean, snatch
- `plyometric` (24) - Box jumps, burpees
- `isolation_upper` (57) - Bicep curls, tricep extensions
- `isolation_lower` (19) - Leg curls, calf raises
- `carry` (16) - Farmer's walk, suitcase carry
- `cardio` (13) - Running, rowing

#### **3.1.2 exercise_muscles**
**Purpose:** Maps exercises to muscle groups

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `exercise_id` | UUID | ✅ | Foreign key to exercises |
| `muscle_group` | VARCHAR(100) | ✅ | Muscle name (e.g., "chest", "triceps") |
| `is_primary` | BOOLEAN | ✅ | Primary vs secondary muscle |

**Primary Key:** `(exercise_id, muscle_group)`

**Example:**
```sql
-- Barbell Bench Press
exercise_id: "uuid-123"
muscle_group: "chest", is_primary: true
muscle_group: "triceps", is_primary: false
muscle_group: "anterior_deltoid", is_primary: false
```

#### **3.1.3 exercise_cues**
**Purpose:** Chunked instructions for exercises

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key |
| `exercise_id` | UUID | ✅ | Foreign key to exercises |
| `cue_text` | TEXT | ✅ | Instruction text |
| `cue_type` | VARCHAR(50) | ✅ | setup, execution, common_mistake, progression_note |
| `cue_order` | INT | ✅ | Display order |
| `embedding` | vector(384) | ❌ | Semantic search vector |
| `created_at` | TIMESTAMP | ✅ | Auto-generated |

**Example:**
```sql
-- Barbell Bench Press
cue_text: "Lie flat on bench with feet planted on floor"
cue_type: "setup"
cue_order: 1

cue_text: "Grip bar slightly wider than shoulder width"
cue_type: "setup"
cue_order: 2

cue_text: "Lower bar to mid-chest with elbows at 45 degrees"
cue_type: "execution"
cue_order: 3
```

#### **3.1.4 voice_commands**
**Purpose:** Tracks all voice parsing attempts for analytics

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key |
| `user_id` | UUID | ✅ | Foreign key to users |
| `workout_id` | UUID | ❌ | Foreign key to workouts |
| `transcript` | TEXT | ✅ | Raw voice transcript |
| `workout_context` | JSONB | ❌ | Context (current exercise, last weight, etc.) |
| `parsed_output` | JSONB | ✅ | Structured exercise data |
| `confidence` | DECIMAL(5,2) | ✅ | 0.00-1.00 |
| `model_id` | TEXT | ✅ | Fine-tuned model ID |
| `latency_ms` | INT | ✅ | Parsing time |
| `was_corrected` | BOOLEAN | ✅ | User corrected the parse |
| `corrected_output` | JSONB | ❌ | User's correction |
| `cache_tier` | TEXT | ❌ | "hit" or "miss" |
| `exercise_id` | UUID | ❌ | Matched exercise |
| `weight_used` | DECIMAL(6,2) | ❌ | Actual weight logged |
| `reps_completed` | INT | ❌ | Actual reps logged |
| `model_used` | TEXT | ❌ | Model version |
| `created_at` | TIMESTAMPTZ | ✅ | Auto-generated |
| `corrected_at` | TIMESTAMPTZ | ❌ | When user corrected |

**Indexes:**
- `idx_voice_commands_user_id` - User queries
- `idx_voice_commands_workout_id` - Workout queries
- `idx_voice_commands_created_at` - Time-based queries
- `idx_voice_commands_confidence` - Confidence analysis
- `idx_voice_commands_cache_tier` - Cache performance
- `idx_voice_commands_exercise_id` - Exercise tracking

#### **3.1.5 workout_logs** (TO BE CREATED)
**Purpose:** Stores completed workout sets

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | UUID | ✅ | Primary key |
| `user_id` | UUID | ✅ | Foreign key to users |
| `workout_id` | UUID | ✅ | Foreign key to workouts |
| `exercise_id` | UUID | ✅ | Foreign key to exercises |
| `set_number` | INT | ✅ | Set number in workout |
| `weight` | DECIMAL(6,2) | ❌ | Weight used (lbs or kg) |
| `weight_unit` | VARCHAR(10) | ❌ | "lbs" or "kg" |
| `reps` | INT | ✅ | Reps completed |
| `duration_seconds` | INT | ❌ | For timed exercises |
| `rpe` | INT | ❌ | 1-10 scale |
| `rir` | INT | ❌ | 0-10 scale |
| `tempo` | VARCHAR(10) | ❌ | e.g., "3010" |
| `rest_seconds` | INT | ❌ | Rest before next set |
| `notes` | TEXT | ❌ | Free-text notes |
| `created_at` | TIMESTAMPTZ | ✅ | Auto-generated |

**Indexes:**
- `idx_workout_logs_user_id` - User queries
- `idx_workout_logs_workout_id` - Workout queries
- `idx_workout_logs_exercise_id` - Exercise queries
- `idx_workout_logs_created_at` - Time-based queries

### 3.2 Relationships Between Entities

```
users (1) ──────────── (many) workouts
  │                              │
  │                              │
  └─────────────────────────────┴──── (many) workout_logs
                                         │
                                         │
exercises (1) ──────────────────────── (many) workout_logs
  │
  ├─────────── (many) exercise_muscles
  ├─────────── (many) exercise_cues
  └─────────── (many) exercise_media

users (1) ──────────── (many) voice_commands
  │
  └─────────── (many) workout_programs
```

### 3.3 Data Types & Validation Rules

**Weight:**
- Type: `DECIMAL(6,2)` (e.g., 225.50)
- Range: 0-9999.99 lbs
- Validation: Must be positive, realistic for exercise type
- Bodyweight exercises: `NULL` (no weight)

**Reps:**
- Type: `INT`
- Range: 1-999
- Validation: Must be positive

**RPE (Rate of Perceived Exertion):**
- Type: `INT`
- Range: 1-10
- Validation: 1 = very easy, 10 = max effort

**RIR (Reps in Reserve):**
- Type: `INT`
- Range: 0-10
- Validation: Calculated from RPE (RIR = 10 - RPE)

**Confidence:**
- Type: `DECIMAL(5,2)`
- Range: 0.00-1.00
- Validation: 0.00 = 0%, 1.00 = 100%

---

**[CONTINUED IN NEXT FILE DUE TO 300-LINE LIMIT]**

This document continues in `FRONTEND_TECHNICAL_SPECIFICATION_PART2.md`

