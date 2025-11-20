# Advanced Calendar Interactions - Design Specification

_Last updated: 2025-11-19_

## 1. Overview

This spec defines advanced calendar features for VoiceFit's program scheduling system, building on the existing `generated_programs`, `workout_templates`, `scheduled_workouts`, and `calendar_workouts` view infrastructure.

**Current State:**
- Basic program scheduling exists (create programs, schedule workouts, view calendar)
- Mobile calendar UI shows scheduled workouts with status indicators
- Backend supports program generation and basic CRUD operations
- UserContextBuilder includes current program context

**Gaps to Address:**
- No drag-and-drop rescheduling
- No conflict detection when scheduling multiple workouts on same day
- No travel/availability mode for schedule adjustments
- No AI-powered schedule suggestions based on adherence/readiness

---

## 2. Feature Breakdown

### 2.1 Drag-and-Drop Rescheduling

**User Story:** As an athlete, I want to drag a scheduled workout to a different day when my plans change, so I can quickly adapt my training schedule.

**Backend Requirements:**
- New endpoint: `PATCH /api/calendar/reschedule`
  - Input: `scheduled_workout_id`, `new_date`, `user_id`
  - Validation: Check for conflicts, ensure date is within program bounds
  - Update: `scheduled_workouts.scheduled_date`, recalculate `week_number` and `day_of_week`
  - Response: Updated workout + any conflicts detected

**Mobile Requirements:**
- Enable long-press + drag gesture on calendar workout cards
- Show drop zones (valid dates) with visual feedback
- Optimistic UI update with rollback on error
- WatermelonDB sync after successful backend update

**Database Changes:**
- Add `rescheduled_from` field to `scheduled_workouts` (nullable date) to track original schedule
- Add `reschedule_reason` field (nullable text) for optional user notes

---

### 2.2 Conflict Detection & Resolution

**User Story:** As an athlete, I want to be warned when I schedule too many workouts on the same day, so I can avoid overtraining.

**Backend Requirements:**
- New endpoint: `GET /api/calendar/conflicts/{user_id}`
  - Query params: `start_date`, `end_date`
  - Returns: List of dates with >1 scheduled workout, total estimated duration per day
- Enhance reschedule endpoint to return conflict warnings
- Add conflict resolution suggestions (e.g., "Move strength to tomorrow?")

**Mobile Requirements:**
- Visual indicator on calendar days with conflicts (orange/red badge)
- Conflict detail modal showing all workouts on that day
- Quick actions: "Move to next available day", "Mark as optional", "Keep both"

**Business Rules:**
- Warn if total estimated duration > 120 minutes on a single day
- Warn if >2 high-intensity workouts scheduled within 48 hours
- Allow user to override warnings (store `conflict_acknowledged` flag)

---

### 2.3 Travel/Availability Mode

**User Story:** As an athlete, I want to mark periods when I'm traveling or unavailable, so the system can suggest schedule adjustments.

**Backend Requirements:**
- New table: `availability_windows`
  - Fields: `id`, `user_id`, `start_date`, `end_date`, `availability_type` (travel|vacation|injury|other), `notes`, `created_at`
- New endpoint: `POST /api/calendar/availability`
  - Create availability window
  - Trigger AI schedule adjustment suggestions
- New endpoint: `GET /api/calendar/availability/{user_id}`
  - Return all availability windows for date range

**Mobile Requirements:**
- "Mark as unavailable" action on calendar
- Date range picker for travel/vacation periods
- Visual overlay on calendar showing unavailable periods (gray out)
- Notification when AI suggests schedule adjustments

**AI Integration:**
- When availability window created, trigger background job:
  - Analyze affected scheduled workouts
  - Suggest: reschedule, compress, or skip specific sessions
  - Use RAG + Grok to generate coach-like recommendations
  - Store suggestions in `schedule_adjustment_suggestions` table

---

### 2.4 AI Schedule Suggestions

**User Story:** As an athlete, I want AI-powered suggestions for optimizing my schedule based on my adherence and readiness, so I can train smarter.

**Backend Requirements:**
- New service: `ScheduleOptimizationService`
  - Inputs: user context (adherence, readiness, injuries, availability)
  - Outputs: Ranked list of schedule adjustments with reasoning
- New endpoint: `POST /api/calendar/suggest-optimizations`
  - Triggers on-demand schedule analysis
  - Returns: List of suggestions with confidence scores
- New table: `schedule_adjustment_suggestions`
  - Fields: `id`, `user_id`, `suggestion_type`, `affected_workout_ids`, `reasoning`, `confidence`, `status` (pending|accepted|rejected), `created_at`

**AI Prompting Strategy:**
- Context: Last 4 weeks adherence, current readiness, upcoming program weeks
- RAG: Pull from scheduling best practices, periodization principles
- Output format: JSON with `suggestion_type`, `action`, `reasoning`, `priority`
- Example suggestions:
  - "Move Saturday long run to Sunday (better recovery after Friday strength)"
  - "Add deload week before race week (high fatigue detected)"
  - "Swap Tuesday/Thursday workouts (equipment availability)"

**Mobile Requirements:**
- "Optimize Schedule" button in calendar view
- Suggestion cards with accept/reject actions
- Preview mode showing before/after schedule
- Batch apply multiple suggestions

---

## 3. Database Schema Extensions

```sql
-- Track rescheduling history
ALTER TABLE scheduled_workouts 
ADD COLUMN rescheduled_from DATE,
ADD COLUMN reschedule_reason TEXT,
ADD COLUMN conflict_acknowledged BOOLEAN DEFAULT FALSE;

-- Availability windows
CREATE TABLE availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  availability_type VARCHAR(50) NOT NULL, -- travel|vacation|injury|other
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI schedule suggestions
CREATE TABLE schedule_adjustment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  suggestion_type VARCHAR(100) NOT NULL, -- reschedule|deload|swap|skip
  affected_workout_ids UUID[] NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  status VARCHAR(20) DEFAULT 'pending', -- pending|accepted|rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

---

## 4. Implementation Priority

1. **P0.3 Backend**: Reschedule endpoint + conflict detection logic
2. **P0.4 Mobile**: Drag-and-drop UI + conflict warnings
3. **P0.3 Backend**: Availability windows + AI suggestion service
4. **P0.4 Mobile**: Travel mode UI + suggestion cards
5. **P0.5 Analytics**: Integrate with adherence monitoring

---

## 5. Success Metrics

- % of users who reschedule workouts (target: >30% monthly active users)
- Conflict detection accuracy (target: <5% false positives)
- AI suggestion acceptance rate (target: >40%)
- Time saved vs manual rescheduling (target: 50% reduction)

