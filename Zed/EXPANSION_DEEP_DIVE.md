# VoiceFit Expansion Deep Dive

_Last updated: 2025-11-19_

## 1. Scope & Assumptions

- This doc covers **post–Phase 1** expansion work where we now have freedom to evolve the schema and services:
  - Finish partially complete items (calendar, Live Activity last).
  - Phase 5–8, 10, 11 from `Zed/FUTURE_PLANS.md`.
- **Constraints for this phase:** planning & design only; implementation will follow in separate work.
- **Global principles:**
  - Single backend (FastAPI + Supabase) serving **iOS + web dashboard**.
  - **Hybrid chat model:** stateless for simple commands, explicit sessions for complex flows.
  - Wearables and nutrition data flow through a **provider-agnostic ingestion layer** with clear per-metric source priority.
  - The **main chat is the hub** for insights, health intelligence, and coaching.

---

## 2. High-Level Implementation Phases

1. **P0 – Finish existing partial features (non-native first)**
   - Finalize advanced calendar interactions (drag/resize, conflict detection, travel mode, AI schedule suggestions).
   - Stabilize adherence/analytics signals that these features depend on.
   - Defer **iOS Live Activity / lock-screen native work** to the very end (handled in Xcode by you).
2. **P1 – Wearables + nutrition ingestion layer (Phase 5 foundation)**
3. **P2 – AI Health Intelligence engine (Phase 6)**
4. **P3 – Advanced personalization (Phase 7)**
5. **P4 – Multi-sport + warmup/cooldown revamp (Phase 8)**
6. **P5 – Enterprise/B2B web dashboard + CSV import + AI review (Phase 11)**
7. **P6 – Voice-first UX & session flows (Phase 10)**
8. **P7 – Native Live Activity polish (Xcode-focused)**

Dependencies are mostly linear: P1 → P2 → P3, and P1+P2 feed P4/P5/P6.

---

## 3. P1 – Wearables & Nutrition Ingestion (Phase 5)

### 3.1 Goals

- Ingest and normalize **WHOOP, Garmin, Apple Health/Google Fit, Oura** data.
- Start with **Terra** as an aggregator while planning **direct integrations** for WHOOP, HealthKit, Garmin, Oura.
- Use this data primarily for:
  - AI Health Intelligence (Phase 6).
  - Program personalization and readiness-aware adjustments (Phase 7/8).

### 3.2 Architecture

- **Wearables Integration Layer** in backend:
  - Provider-agnostic interface: `ingest_metrics(user_id, provider, payload)`.
  - Adapters for: Terra, WHOOP, Garmin, Apple Health, Oura.
  - Supports both **webhooks** (preferred) and **scheduled pulls**.
- **Metric priority model** (per user/day/metric):
  - WHOOP primary for: sleep, recovery, HRV, strain.
  - Garmin primary for: cardio workout detail + effort metrics.
  - Apple Health/Google Fit: catch-all / fallback when primary sources absent.

### 3.3 Conceptual data model

_Not SQL, just conceptual tables/fields._

- `wearable_raw_events`
  - `id`, `user_id`, `provider`, `event_type`, `payload_json`, `received_at`.
- `daily_metrics`
  - `id`, `user_id`, `date`, `metric_type` (sleep, strain, HRV, etc.),
  - `source` (whoop|garmin|apple|oura), `value_numeric`, `value_json`.
- `daily_nutrition_summary` (can replace or supersede `nutrition_logs`):
  - `id`, `user_id`, `date`, `source`, `calories`, `protein_g`, `carbs_g`, `fat_g`, plus optional macros.

### 3.4 Services & flows

- Ingestion service:
  - Parse provider payload → append to `wearable_raw_events` → upsert into `daily_metrics` / `daily_nutrition_summary` using source-priority rules.
- Integration into **UserContextBuilder**:
  - For each user, fetch last N days of `daily_metrics` + `daily_nutrition_summary`.
  - Provide concise, domain-specific summaries for AI prompts (health engine, coach chat, program generation).

---

## 4. P2 – AI Health Intelligence Engine (Phase 6)

### 4.1 Goals

- Produce **daily and on-demand health insights** directly in the **main chat**:
  - Readiness-style summaries: how training, sleep, recovery, injuries, and nutrition intersect.
  - Warnings about overload, under-recovery, or inconsistent adherence.
  - Clear, coach-like recommendations (adjust today, adjust this week, adjust upcoming blocks).

### 4.2 Inputs

- Training logs: workouts, runs, adherence flags, PR history.
- Wearables: `daily_metrics` for sleep, recovery, strain, HRV, etc.
- Injuries, pain, mobility flags.
- Nutrition summaries.

### 4.3 Engine design

- **Aggregation layer**:
  - Build a daily `health_snapshot(user_id, date)` object combining all inputs.
  - Run on-demand or via small scheduled jobs (e.g., once per day per active user).
- **LLM layer (Health Intelligence Service)**:
  - Prompted with recent `health_snapshot`s + schedule/program context.
  - Outputs:
    - Short summary + 2–4 key bullet insights.
    - Optional recommended adjustments (tagged as suggestions, not commands).
- **Surfacing in chat**:
  - Health engine messages appear **in the same chat thread** as coach/program talks.
  - User can query: "How am I trending this week?", "Is my recovery okay to race Sunday?".

### 4.4 Safety

- Strict prompt boundaries around **non-medical** language.
- Emphasis on training load, recovery balance, and performance—not diagnosis.

---

## 5. P3 – Advanced Personalization (Phase 7)

### 5.1 Goals

- Have the system truly **adapt to real-life constraints** and preferences:
  - Schedule, session length, equipment, environment.
  - Tolerance for intensity, preference for variety, etc.
- Avoid overbearing “we know better” behavior; respect constraints like “30-minute weekday sessions”.

### 5.2 Preference model

- Extend `user_profiles` + companion tables (conceptually `user_preferences`).
- Store **structured fields** for:
  - Available equipment, training days per week.
  - Preferred weekday/weekend session lengths.
  - Time-of-day windows.
  - Mobility/pain flags (ankles, shoulders, knees, lower back, etc.).
- Allow updating via **chat**:
  - e.g., "I only have 30 minutes on weekdays" → stored as preference and honored.

### 5.3 Behavior changes

- Program generation:
  - Prompts incorporate preferences; respect constraints over theoretical ideals.
- Adherence-aware adaptation:
  - If adherence drops due to time, engine proactively suggests shorter or restructured blocks.
- Health intelligence + coach chat:
  - Explicitly call out when plan and reality diverge, proposing more realistic structures.

---

## 6. P4 – Multi-Sport & Warmup/Cooldown Revamp (Phase 8)

### 6.1 Multi-sport support

- Extend program types to cover:
  - Running, cycling, swimming, triathlon, hybrid athletes.
- Scheduling model:
  - Multiple sessions per day, with explicit sport tags.
  - Proper taper and periodization across sports.
- Analytics:
  - Combine volume and intensity across modalities without double counting (esp. with wearables data).

### 6.2 Warmup/cooldown template system

- Replace ad-hoc warmup/cooldown behavior with **library-driven templates**:
  - Templates keyed by movement pattern, joints, session type, and user issues.
- Selection engine for each scheduled workout:
  - Inputs: workout structure (movements, intensity), user mobility/injury flags.
  - Output: chosen warmup template + cooldown template.
- Templates are **reusable and cacheable**, not re-generated every time via LLM.

---

## 7. P5 – Enterprise/B2B Web Dashboard & CSV Import (Phase 11)

### 7.1 Stack & sync

- Frontend: **Next.js** dashboard app.
- Backend: existing **FastAPI + Supabase**; new coach/org endpoints.
- Identity model:
  - Solo coaches and organizations/teams; coaches own or belong to orgs.
- Sync with iOS:
  - Both iOS and web read/write to the same Supabase tables.
  - Sub-minute sync via a mix of polling and Supabase Realtime where appropriate.

### 7.2 CSV/Excel import pipeline

- Upload flow in dashboard:
  - Coach selects template download (official schema) or directly uploads arbitrary CSV/Excel.
  - Backend parses file → runs AI-assisted **column mapping** and **cleaning**.
- AI schema guidance:
  - Detect missing or suspicious columns; propose mappings and fixes.
  - Inline, chat-like clarifications: "Did you mean week_number here?".
- Program quality review:
  - After mapping, AI reviews the imported program:
    - Flags outliers (e.g., back-to-back extreme long runs, missing taper).
    - Suggests optional improvements.
  - Dashboard UI shows suggestions with actions: **Ignore**, **Confirm**, or **Apply tweak**.
- Errors and feedback are surfaced **immediately in the web UI**; iOS does not need this flow.

---

## 8. P6 – Voice-First UX & Session Model (Phase 10)

### 8.1 Hybrid stateless/stateful design

- **Stateless**:
  - Quick commands (logging, simple questions) use DB context only; no explicit session.
- **Stateful sessions** for complex flows:
  - E.g., building/changing 16–24 week triathlon plans, deep schedule edits.
  - Conceptual `chat_sessions` / `voice_sessions` table:
    - `id`, `user_id`, `type`, `status`, `state_json`, timestamps.
  - Sessions store **thin state** (which program, focus weeks, current draft), not full transcripts.

### 8.2 Voice & personality

- Off-topic questions:
  - Politely refuse with a **lightly sarcastic / humorous** tone, then redirect back to training.
- Coaching responses:
  - Actionable, between short and long: brief summary + concrete next steps.
- All health intelligence, personalization feedback, and schedule changes run through this same chat.

---

## 9. Next Steps

- Treat this doc as the **source of truth** for expansion-phase design.
- For each phase (P1–P6), we can now:
  - Break down specific tickets (backend, Supabase, iOS, web, voice).
  - Map to existing docs (e.g., `AI_HEALTH_INTELLIGENCE_ENGINE.md`) and update them as needed.
- Implementation work will follow in separate, code-focused sessions once you sign off on this plan.

