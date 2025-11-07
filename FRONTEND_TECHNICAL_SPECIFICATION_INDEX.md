# Voice Fit - Frontend Technical Specification
## Complete Index & Quick Reference

**Version:** 1.0  
**Date:** November 5, 2025  
**Status:** ✅ Backend Production Ready | ⚠️ Frontend To Be Built

---

## 📚 Document Structure

This technical specification is split into 3 parts for readability:

### **Part 1: Architecture & Core Features**
**File:** `FRONTEND_TECHNICAL_SPECIFICATION.md`

**Contents:**
1. System Architecture Overview
   - High-level architecture diagram
   - Backend infrastructure (Supabase, OpenAI, Upstash, FastAPI)
   - Data flow: Voice input → Database storage
   - Authentication & session management

2. Core Features & Functionality
   - Program building (planned)
   - Workout logging (implemented)
   - Voice interaction system
   - Exercise parsing pipeline
   - Auto-regulation features
   - Progress tracking

3. Database Schema & Data Models
   - Core tables (exercises, exercise_muscles, exercise_cues, voice_commands, workout_logs)
   - Relationships between entities
   - Data types & validation rules

---

### **Part 2: API Integration & User Flows**
**File:** `FRONTEND_TECHNICAL_SPECIFICATION_PART2.md`

**Contents:**
4. API Integration Guide
   - Base configuration & environment variables
   - Authentication flow (JWT tokens)
   - Voice parsing endpoint (`POST /api/voice/parse`)
   - Session management endpoints
   - Health check endpoint
   - Error handling & edge cases

5. User Flow & Screen Requirements
   - Complete user journey (app launch → workout completion)
   - Required screens (Auth, Home, Log, START, PRs, Coach)
   - Component hierarchy & reusable UI elements
   - State management requirements (Zustand stores)

---

### **Part 3: Voice UX & Implementation**
**File:** `FRONTEND_TECHNICAL_SPECIFICATION_PART3.md`

**Contents:**
6. Voice Interaction UX Specifications
   - Supported voice commands & natural language patterns
   - Real-time feedback requirements
   - Error states & user corrections flow
   - Offline behavior & sync requirements

7. Technical Implementation Notes
   - Web-first development approach
   - iOS production deployment strategy
   - Figma UI kit integration
   - WatermelonDB for iOS offline storage
   - Apple Speech Framework integration

8. Data Synchronization
   - Voice commands sync with Supabase
   - Cache behavior & performance optimization
   - Offline-first considerations for iOS

---

## 🎯 Quick Reference

### Backend Services (Production Ready)

| Service | Status | Details |
|---------|--------|---------|
| **Supabase Database** | ✅ Ready | 456 exercises, PostgreSQL 17 + pgvector |
| **Fine-Tuned Model** | ✅ Ready | GPT-4o-mini, 95.57% accuracy, 3,890 training examples |
| **Upstash Search** | ✅ Ready | 100% test success, 50-100ms latency |
| **FastAPI Backend** | ✅ Ready | JWT auth, CORS configured, 99% uptime |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/voice/parse` | POST | Parse voice command |
| `/api/session/{user_id}/summary` | GET | Get session summary |
| `/api/session/{user_id}/end` | POST | End workout session |

### Database Tables

| Table | Rows | Purpose |
|-------|------|---------|
| `exercises` | 456 | Exercise database |
| `exercise_muscles` | ~1,200 | Muscle group mappings |
| `exercise_cues` | ~2,000 | Chunked instructions |
| `voice_commands` | 0+ | Voice parsing analytics |
| `workout_logs` | 0+ | Completed workout sets |

### Voice Command Examples

```
Standard:
- "Bench press 225 for 8"
- "Bench press 225 for 8 at RPE 8"

Abbreviations:
- "RDL 315 for 5"
- "OHP 135 for 8"
- "db rows 80s for 12"

Competition:
- "comp bench 185 for 8"
- "pause squat 315 for 3"

Same Weight:
- "same weight for 7"
- "same for 6"

Bodyweight:
- "pull-ups for 10"
- "push-ups for 20"
```

### Confidence-Based UX

| Confidence | Action | UX |
|------------|--------|-----|
| **≥85%** | `auto_accept` | Auto-accept, show brief confirmation (2s) |
| **70-85%** | `needs_confirmation` | Show confirmation sheet, require tap |
| **<70%** | `needs_clarification` | Show error, ask to retry |

### Technology Stack

**Frontend:**
- React Native (0.79.0)
- Expo SDK 53
- Gluestack UI v3
- NativeWind (Tailwind)
- Zustand (state)
- React Navigation

**Backend:**
- FastAPI (Python)
- Supabase (PostgreSQL)
- OpenAI (GPT-4o-mini)
- Upstash (Search cache)

**Testing:**
- Jest + RTL (unit)
- Playwright (web E2E)
- Detox (iOS E2E)

---

## 📱 Development Workflow

### Web-First Approach

```
1. Build on WEB (localhost)
   ↓
2. Test with Playwright
   ↓
3. Verify UI/UX in browser
   ↓
4. Port to iOS
   ↓
5. Replace mocks with native APIs
   ↓
6. Test with Detox
   ↓
7. Deploy to TestFlight
```

### Phase Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | Week 1 | Foundation & setup |
| **Phase 2** | Weeks 2-3 | Web app with tests |
| **Phase 3** | Week 4 | Voice logging (web) |
| **Phase 4** | Weeks 5-6 | iOS migration |
| **Phase 5** | Week 7 | iOS native features |
| **Phase 6** | Week 8 | Polish & advanced features |
| **Phase 7** | Weeks 9-10 | Testing & launch |

---

## 🔑 Key Concepts

### Voice Parsing Pipeline

```
TRANSCRIPT
   ↓
FINE-TUNED GPT-4o-mini
   ↓
VALIDATION LAYER
   ↓
UPSTASH SEARCH
   ↓
DATABASE MATCHING
   ↓
RESPONSE TO FRONTEND
```

### Session Management

```
Session ID: session_{user_id}_{unix_timestamp}
Session Start: First voice command
Session Context: Current exercise, set number, total sets
Session End: User taps "End Workout"
```

### Data Flow

```
USER SPEAKS
   ↓
APPLE SPEECH FRAMEWORK (iOS) / KEYBOARD (Web)
   ↓
FRONTEND: VoiceAPIClient.parseVoiceCommand()
   ↓
BACKEND: Fine-Tuned Model + Validation + Search
   ↓
FRONTEND: Confidence-Based UX
   ↓
DATABASE: workout_logs table
```

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Model Accuracy** | >95% | 95.57% ✅ |
| **Voice Recognition** | <3s | TBD |
| **Cache Hit Rate** | >60% | 0% (needs warmup) |
| **API Latency (p95)** | <5000ms | 4491ms ✅ |
| **Error Rate** | <1% | 0.97% ✅ |

---

## 🎨 Design System

**Colors:**
- Primary: Forest Green (#2C5F3D)
- Secondary: Terracotta (#DD7B57)
- Accent: Deep Teal (#36625E)
- Background: Cream (#FBF7F5)

**Typography:**
- Heading: Inter Bold
- Body: Inter Regular
- Sizes: h1 (32px), h2 (28px), h3 (24px), body (16px)

**Touch Targets:**
- Primary: 60pt (gym-optimized)
- Minimum: 44pt (Apple HIG)

---

## 🗂️ File Structure

```
/Users/zach/Desktop/VoiceFit/
├── FRONTEND_TECHNICAL_SPECIFICATION.md          (Part 1)
├── FRONTEND_TECHNICAL_SPECIFICATION_PART2.md    (Part 2)
├── FRONTEND_TECHNICAL_SPECIFICATION_PART3.md    (Part 3)
├── FRONTEND_TECHNICAL_SPECIFICATION_INDEX.md    (This file)
│
├── apps/
│   ├── backend/                                 (FastAPI)
│   │   ├── main.py                              (API endpoints)
│   │   ├── voice_parser.py                      (Voice parsing)
│   │   └── models.py                            (Pydantic models)
│   │
│   └── mobile/                                  (TO BE CREATED)
│       └── voice-fit-app/                       (React Native)
│
├── archive/
│   ├── backend-development/                     (Backend scripts)
│   └── database-migrations/                     (SQL schemas)
│
└── docs/                                        (Phase documentation)
    ├── PHASE_1_FOUNDATION.md
    ├── PHASE_2_WEB_DEVELOPMENT.md
    ├── PHASE_3_VOICE_PROCESSING.md
    └── ...
```

---

## 🚀 Getting Started

### For UI/UX Developers

1. **Read Part 1** - Understand system architecture and core features
2. **Read Part 2** - Learn API integration and user flows
3. **Read Part 3** - Implement voice UX and data sync
4. **Start Phase 1** - See `docs/PHASE_1_FOUNDATION.md`

### For Backend Developers

1. **API is ready** - See `apps/backend/main.py`
2. **Test endpoints** - Visit `http://localhost:8000/docs`
3. **Database schema** - See `archive/database-migrations/01_schema.sql`

### For QA/Testing

1. **Unit tests** - 96 tests passing (49 unit + 9 integration + 38 YouTube)
2. **Load tests** - 99% success rate (103 requests)
3. **E2E tests** - Playwright (web), Detox (iOS)

---

## 📞 Support & Resources

**Documentation:**
- API Docs: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`
- Database Schema: `archive/database-migrations/01_schema.sql`
- Voice Parser: `apps/backend/voice_parser.py`

**Environment Variables:**
```bash
# Backend
SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
VOICE_MODEL_ID=ft:gpt-4o-mini-2024-07-18:personal:voice-fit-complete-v1:CYENuc9G

# Frontend
EXPO_PUBLIC_VOICE_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://szragdskusayriycfhrs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Testing:**
```bash
# Start backend
cd apps/backend
python3 main.py

# Test API
curl http://localhost:8000/health

# Run tests
pytest tests/
```

---

## ✅ Checklist for UI/UX Team

### Before Starting Development

- [ ] Read all 3 parts of technical specification
- [ ] Understand voice parsing pipeline
- [ ] Review API endpoints and request/response formats
- [ ] Understand confidence-based UX (≥85%, 70-85%, <70%)
- [ ] Review Figma UI kit and design tokens
- [ ] Set up development environment (Expo, Node.js, etc.)

### Phase 1: Foundation

- [ ] Initialize Expo project (SDK 53)
- [ ] Configure Gluestack UI v3 + NativeWind
- [ ] Set up Tailwind with Figma design tokens
- [ ] Create 5-tab navigation (Home, Log, START, PRs, Coach)
- [ ] Configure TypeScript + ESLint

### Phase 2: Web Development

- [ ] Build core screens (empty states)
- [ ] Implement Zustand stores (workout, auth, exercise)
- [ ] Set up Supabase client
- [ ] Create platform abstraction layer
- [ ] Configure Playwright for E2E testing

### Phase 3: Voice Processing

- [ ] Build VoiceFAB component
- [ ] Implement keyboard input modal (web testing)
- [ ] Create VoiceAPIClient with retry logic
- [ ] Implement confidence-based UX
- [ ] Test with mock API responses

### Phase 4: iOS Migration

- [ ] Add Apple Speech Framework
- [ ] Implement WatermelonDB
- [ ] Set up Supabase sync
- [ ] Add haptic feedback
- [ ] Configure Detox for iOS testing

### Phase 5-7: Polish & Launch

- [ ] Animations (Reanimated 3.x)
- [ ] Dark mode
- [ ] Charts (Victory Native XL)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] TestFlight beta
- [ ] App Store submission

---

## 🎉 Summary

**Backend Status:** ✅ Production Ready
- Fine-tuned model: 95.57% accuracy
- Database: 456 exercises
- API: 99% uptime
- Tests: 96 passing

**Frontend Status:** ⚠️ To Be Built
- Technology stack: Defined
- Design system: Ready (Figma UI kit)
- API integration: Documented
- User flows: Specified

**Next Steps:**
1. Review this specification
2. Start Phase 1 (Foundation)
3. Build web app first (faster iteration)
4. Port to iOS (native features)
5. Launch! 🚀

---

**Questions?** Check the individual specification parts for detailed information on each topic.

**Ready to build?** Start with `docs/PHASE_1_FOUNDATION.md`!

