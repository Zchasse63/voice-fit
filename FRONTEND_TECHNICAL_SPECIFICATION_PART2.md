# Voice Fit - Frontend Technical Specification (Part 2)
**Continued from FRONTEND_TECHNICAL_SPECIFICATION.md**

---

## 4. API Integration Guide

### 4.1 Base Configuration

**Environment Variables:**
```bash
# Development (Web)
EXPO_PUBLIC_VOICE_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Production (iOS)
EXPO_PUBLIC_VOICE_API_URL=https://api.voicefit.app  # TBD
EXPO_PUBLIC_SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**API Client Setup:**
```typescript
// src/services/api/VoiceAPIClient.ts
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_VOICE_API_URL;
const TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

export class VoiceAPIClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async parseVoiceCommand(request: VoiceParseRequest): Promise<VoiceParseResponse> {
    // Implementation with retry logic
  }
}
```

### 4.2 Authentication Flow

**JWT Token Management:**
```typescript
// 1. User signs in via Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// 2. Extract JWT token
const token = data.session?.access_token;

// 3. Store token securely
// Web: localStorage (dev only)
// iOS: Keychain (expo-secure-store)
await SecureStore.setItemAsync('auth_token', token);

// 4. Include token in API requests
const response = await fetch(`${API_URL}/api/voice/parse`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(request),
});
```

**Token Refresh:**
```typescript
// Supabase automatically refreshes tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    const newToken = session?.access_token;
    await SecureStore.setItemAsync('auth_token', newToken);
  }
});
```

### 4.3 Voice Parsing Endpoint

**Endpoint:** `POST /api/voice/parse`

**Request Format:**
```typescript
interface VoiceParseRequest {
  transcript: string;           // Required: Voice transcript
  user_id: string;              // Required: User UUID
  previous_set?: PreviousSet;   // Optional: For "same weight" handling
  auto_save?: boolean;          // Optional: Auto-save high-confidence sets
}

interface PreviousSet {
  exercise_id?: string;
  exercise_name?: string;
  weight?: number;
  weight_unit?: string;
  reps?: number;
  rpe?: number;
}
```

**Example Request:**
```json
{
  "transcript": "Bench press 225 for 8 at RPE 8",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "auto_save": true
}
```

**Response Format:**
```typescript
interface VoiceParseResponse {
  success: boolean;
  action: 'auto_accept' | 'needs_confirmation' | 'needs_clarification';
  confidence: number;           // 0.0-1.0
  data: ParsedWorkoutData;
  transcript: string;
  same_weight_detected: boolean;
  session_context?: SessionContext;
  edge_case?: string;
  message?: string;
  saved?: boolean;
  save_error?: string;
}

interface ParsedWorkoutData {
  exercise_id?: string;
  exercise_name?: string;
  exercise_match_score?: number;
  weight?: number;
  weight_unit?: string;
  reps?: number;
  duration_seconds?: number;
  rpe?: number;
  rir?: number;
  tempo?: string;
  rest_seconds?: number;
  notes?: string;
  confidence?: number;
}

interface SessionContext {
  session_id: string;
  set_number: number;
  is_exercise_switch: boolean;
  edge_case_handled: boolean;
  total_sets_in_session: number;
}
```

**Example Response (High Confidence):**
```json
{
  "success": true,
  "action": "auto_accept",
  "confidence": 0.95,
  "data": {
    "exercise_id": "550e8400-e29b-41d4-a716-446655440000",
    "exercise_name": "Barbell Bench Press",
    "exercise_match_score": 95.0,
    "weight": 225,
    "weight_unit": "lbs",
    "reps": 8,
    "rpe": 8,
    "rir": 2,
    "confidence": 0.95
  },
  "transcript": "Bench press 225 for 8 at RPE 8",
  "same_weight_detected": false,
  "session_context": {
    "session_id": "session_user_123_1762191736",
    "set_number": 1,
    "is_exercise_switch": false,
    "edge_case_handled": false,
    "total_sets_in_session": 1
  },
  "saved": true
}
```

**Example Response (Medium Confidence):**
```json
{
  "success": true,
  "action": "needs_confirmation",
  "confidence": 0.78,
  "data": {
    "exercise_id": "550e8400-e29b-41d4-a716-446655440000",
    "exercise_name": "Barbell Romanian Deadlift",
    "weight": 315,
    "reps": 5,
    "confidence": 0.78
  },
  "transcript": "RDL 315 for 5",
  "message": "Did you mean Barbell Romanian Deadlift?"
}
```

**Example Response (Low Confidence):**
```json
{
  "success": false,
  "action": "needs_clarification",
  "confidence": 0.45,
  "data": {},
  "transcript": "bench something for some reps",
  "message": "Could not understand. Please try again."
}
```

**Error Handling:**
```typescript
try {
  const response = await voiceAPIClient.parseVoiceCommand(request);
  
  if (response.action === 'auto_accept') {
    // High confidence: Auto-accept and show brief confirmation
    showConfirmation(response.data, 2000); // 2 seconds
    addSetToWorkout(response.data);
  } else if (response.action === 'needs_confirmation') {
    // Medium confidence: Show confirmation sheet
    showConfirmationSheet(response.data);
  } else {
    // Low confidence: Show error and retry
    showError(response.message || 'Could not understand. Please try again.');
  }
} catch (error) {
  if (error.code === 'TIMEOUT') {
    showError('Request timed out. Please try again.');
  } else if (error.code === 'NETWORK_ERROR') {
    showError('Network error. Check your connection.');
  } else {
    showError('An error occurred. Please try again.');
  }
}
```

### 4.4 Session Management Endpoints

#### **4.4.1 Get Session Summary**

**Endpoint:** `GET /api/session/{user_id}/summary`

**Response:**
```typescript
interface SessionSummaryResponse {
  session_id: string;
  started_at: string;           // ISO 8601 timestamp
  total_sets: number;
  current_exercise?: {
    exercise_id: string;
    exercise_name: string;
    sets_completed: number;
  };
  exercises_count: number;
}
```

**Example:**
```json
{
  "session_id": "session_user_123_1762191736",
  "started_at": "2025-11-05T14:30:00Z",
  "total_sets": 12,
  "current_exercise": {
    "exercise_id": "uuid",
    "exercise_name": "Barbell Bench Press",
    "sets_completed": 4
  },
  "exercises_count": 3
}
```

#### **4.4.2 End Session**

**Endpoint:** `POST /api/session/{user_id}/end`

**Response:**
```typescript
interface EndSessionResponse {
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  total_sets: number;
  exercises_count: number;
  exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    sets: number;
    total_reps: number;
    avg_weight: number;
    avg_rpe: number;
  }>;
}
```

**Example:**
```json
{
  "session_id": "session_user_123_1762191736",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "started_at": "2025-11-05T14:30:00Z",
  "ended_at": "2025-11-05T15:45:00Z",
  "total_sets": 15,
  "exercises_count": 4,
  "exercises": [
    {
      "exercise_id": "uuid-1",
      "exercise_name": "Barbell Bench Press",
      "sets": 4,
      "total_reps": 32,
      "avg_weight": 225,
      "avg_rpe": 8
    },
    {
      "exercise_id": "uuid-2",
      "exercise_name": "Barbell Bent Over Row",
      "sets": 4,
      "total_reps": 32,
      "avg_weight": 185,
      "avg_rpe": 7
    }
  ]
}
```

### 4.5 Health Check Endpoint

**Endpoint:** `GET /health`

**Response:**
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  version: string;
  model_id: string;
  supabase_connected: boolean;
}
```

**Example:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "model_id": "ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G",
  "supabase_connected": true
}
```

### 4.6 Error Handling & Edge Cases

**HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid request (missing transcript, invalid user_id)
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Backend error

**Error Response Format:**
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  detail?: string;
}
```

**Common Errors:**
```json
// Missing transcript
{
  "success": false,
  "error": "Invalid request",
  "detail": "Transcript cannot be empty"
}

// Invalid JWT token
{
  "success": false,
  "error": "Unauthorized",
  "detail": "Invalid token: signature verification failed"
}

// Session not found
{
  "success": false,
  "error": "Session not found",
  "detail": "No active session for user"
}
```

**Edge Cases:**

1. **"Same Weight" References:**
   ```typescript
   // User says: "same weight for 7"
   // Must provide previous_set in request
   {
     "transcript": "same weight for 7",
     "user_id": "uuid",
     "previous_set": {
       "exercise_id": "uuid",
       "weight": 225,
       "weight_unit": "lbs"
     }
   }
   ```

2. **Bodyweight Exercises:**
   ```typescript
   // User says: "pull-ups for 10"
   // Response will have weight: null
   {
     "data": {
       "exercise_name": "Pull-Up",
       "weight": null,
       "weight_unit": null,
       "reps": 10
     }
   }
   ```

3. **Ambiguous Exercise Names:**
   ```typescript
   // User says: "bench for 8"
   // Backend will match to most common variation
   {
     "data": {
       "exercise_name": "Barbell Bench Press",
       "confidence": 0.82,
       "message": "Did you mean Barbell Bench Press?"
     },
     "action": "needs_confirmation"
   }
   ```

---

## 5. User Flow & Screen Requirements

### 5.1 Complete User Journey

```
APP LAUNCH
   │
   ▼
AUTHENTICATION
   │ - Sign in / Sign up (Supabase Auth)
   │ - Store JWT token
   ▼
HOME SCREEN
   │ - Daily overview
   │ - Readiness check
   │ - Quick stats
   ▼
SELECT PROGRAM (or Quick Workout)
   │ - Choose from saved programs
   │ - Or start quick workout
   ▼
START SCREEN (CORE FEATURE)
   │ - Voice FAB (floating action button)
   │ - Current exercise display
   │ - Set history
   ▼
TAP VOICE FAB
   │ - Mic icon animates
   │ - Start listening (Apple Speech Framework)
   ▼
SPEAK COMMAND
   │ - "Bench press 225 for 8 at RPE 8"
   │ - Visual feedback (waveform animation)
   ▼
PROCESSING
   │ - Show loading indicator
   │ - Call /api/voice/parse
   │ - Wait for response (<3s)
   ▼
CONFIDENCE-BASED UX
   │
   ├─ HIGH (≥85%)
   │  │ - Auto-accept
   │  │ - Show brief confirmation (2s)
   │  │ - Add to workout
   │  └─ Return to START screen
   │
   ├─ MEDIUM (70-85%)
   │  │ - Show confirmation sheet
   │  │ - Display parsed data
   │  │ - "Confirm" or "Retry" buttons
   │  └─ User taps "Confirm" → Add to workout
   │
   └─ LOW (<70%)
      │ - Show error message
      │ - "Could not understand. Please try again."
      └─ Return to START screen
   ▼
REPEAT FOR ALL SETS
   │ - Voice FAB always visible
   │ - Set history updates in real-time
   ▼
END WORKOUT
   │ - Tap "End Workout" button
   │ - Call /api/session/{user_id}/end
   ▼
WORKOUT SUMMARY
   │ - Total sets, exercises, volume
   │ - Per-exercise stats
   │ - "Save" or "Discard" buttons
   ▼
SAVE TO DATABASE
   │ - Insert into workout_logs table
   │ - Sync to Supabase (web) or WatermelonDB (iOS)
   ▼
RETURN TO HOME
   │ - Updated stats
   │ - Next workout suggestion
```

### 5.2 Required Screens/Pages

#### **5.2.1 Authentication Screens**
- **Sign In** - Email/password, social auth (Google, Apple)
- **Sign Up** - Email/password, terms acceptance
- **Forgot Password** - Email reset link
- **Onboarding** - Welcome, permissions (microphone, notifications)

#### **5.2.2 Home Screen**
- **Daily Overview** - Today's workout, streak, quick stats
- **Readiness Check** - Sleep, stress, soreness questionnaire
- **Quick Actions** - Start workout, view history, settings

#### **5.2.3 Log Screen**
- **Workout History** - List of past workouts
- **Filters** - Date range, exercise, muscle group
- **Search** - Find specific workouts
- **Details** - Tap workout → see full details

#### **5.2.4 START Screen (CORE)**
- **Voice FAB** - Floating action button (center, 1.5x size)
- **Current Exercise** - Display current exercise name
- **Set History** - List of completed sets in current workout
- **End Workout** - Button to end session

#### **5.2.5 PRs Screen**
- **Personal Records** - Max weight, max reps, max volume
- **Filters** - By exercise, muscle group, time period
- **Charts** - Weight progression over time

#### **5.2.6 Coach Screen**
- **AI Chat** - Ask questions, get advice
- **Settings** - Profile, preferences, logout
- **Help** - FAQs, tutorials, support

### 5.3 Component Hierarchy & Reusable UI Elements

**Component Structure:**
```
App
├── Navigation (5-tab bottom nav)
│   ├── HomeScreen
│   ├── LogScreen
│   ├── StartScreen (CORE)
│   ├── PRsScreen
│   └── CoachScreen
│
├── Shared Components
│   ├── VoiceFAB (floating action button)
│   ├── ConfirmationSheet (medium confidence)
│   ├── SetCard (display completed set)
│   ├── ExerciseCard (display exercise info)
│   ├── ChartCard (performance charts)
│   ├── Button (primary, secondary, tertiary)
│   ├── Input (text, number, select)
│   ├── Modal (confirmation, error, info)
│   └── LoadingIndicator (spinner, skeleton)
│
└── Services
    ├── VoiceAPIClient (API calls)
    ├── VoiceService (speech recognition)
    ├── DatabaseService (Supabase/WatermelonDB)
    └── AuthService (Supabase Auth)
```

**Reusable Components:**

1. **VoiceFAB:**
   - Size: 80pt diameter (1.5x standard)
   - Icon: Microphone
   - States: Idle, Listening, Processing
   - Animation: Pulse when listening
   - Position: Bottom center (above tab bar)

2. **ConfirmationSheet:**
   - Slide up from bottom
   - Display parsed data (exercise, weight, reps, RPE)
   - Confidence indicator (color-coded)
   - Buttons: "Confirm", "Retry", "Edit"

3. **SetCard:**
   - Display: Exercise name, weight, reps, RPE
   - Timestamp: "2 minutes ago"
   - Actions: Edit, Delete

4. **ExerciseCard:**
   - Display: Exercise name, muscles, equipment
   - Thumbnail: Exercise image
   - Actions: View details, Add to workout

5. **ChartCard:**
   - Library: Victory Native XL
   - Types: Line, Bar, Scatter
   - Data: Weight progression, volume, frequency

### 5.4 State Management Requirements

**Global State (Zustand):**
```typescript
// src/store/workoutStore.ts
interface WorkoutStore {
  // Current workout session
  currentWorkout: Workout | null;
  currentExercise: Exercise | null;
  sets: Set[];
  
  // Actions
  startWorkout: (programId?: string) => void;
  endWorkout: () => Promise<WorkoutSummary>;
  addSet: (set: Set) => void;
  updateSet: (setId: string, updates: Partial<Set>) => void;
  deleteSet: (setId: string) => void;
  
  // Session management
  sessionId: string | null;
  sessionStartTime: Date | null;
}

// src/store/authStore.ts
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// src/store/exerciseStore.ts
interface ExerciseStore {
  exercises: Exercise[];
  loading: boolean;
  
  // Actions
  fetchExercises: () => Promise<void>;
  searchExercises: (query: string) => Exercise[];
  getExerciseById: (id: string) => Exercise | null;
}
```

**Session-Based State:**
- Current workout data (in-memory, cleared on end)
- Voice recognition state (listening, processing, idle)
- Confirmation sheet visibility

**Persistent State:**
- User preferences (weight unit, theme, notifications)
- Cached exercises (for offline use)
- Workout history (last 30 days)

---

**[CONTINUED IN NEXT FILE]**

This document continues in `FRONTEND_TECHNICAL_SPECIFICATION_PART3.md`

