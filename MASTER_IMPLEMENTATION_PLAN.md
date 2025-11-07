# Voice Fit - Master Implementation Plan

**Version:** 1.1
**Date:** November 5, 2025
**Status:** Phase 4 Complete - Ready for Phase 5 or 6

---

## 📍 Project Location & Structure

### **Primary Directory**
```
/Users/zach/Desktop/Voice Fit/
├── voice-fit-app/              # React Native app (TO BE CREATED in Phase 1)
├── api/                         # Backend API (EXISTING - Python FastAPI)
├── phases/                      # Phase documentation (THIS DOCUMENT CREATES)
├── *.py, *.sql, *.json         # Backend files (EXISTING)
└── *.md                         # Planning docs (EXISTING + NEW)
```

### **App Directory** (Created in Phase 1)
```
/Users/zach/Desktop/Voice Fit/voice-fit-app/
├── src/
│   ├── components/             # UI components
│   ├── screens/                # Screen components
│   ├── navigation/             # React Navigation
│   ├── services/               # Business logic + platform abstraction
│   ├── store/                  # Zustand stores
│   ├── theme/                  # Design system (Figma → Tailwind)
│   ├── types/                  # TypeScript types
│   └── utils/                  # Helper functions
├── __tests__/                  # All tests
├── .maestro/                   # Maestro E2E tests (iOS)
├── app.json                    # Expo config
├── package.json                # Dependencies
└── tailwind.config.js          # Tailwind + Figma tokens
```

---

## 🎯 Executive Summary

**Voice Fit** is a voice-first fitness tracking iOS app built with React Native and Expo. This plan unifies:
- **UI/UX Spec** (2,358 lines) - Complete user experience
- **VF Technical** (2,377 lines) - Technical architecture
- **Figma UI Kit** (FinWise) - Design system
- **Original UI Plan** - Technology stack

### **Key Decisions (CONFIRMED)**
✅ **Expo SDK 53** (~53.0.0) - Stable, Gluestack compatible  
✅ **Gluestack UI v3** - NativeWind/Tailwind integration  
✅ **Web-first development** - Local testing only, iOS production  
✅ **Detox** - iOS E2E testing (gray-box, powerful)  
✅ **Zustand** - State management  
✅ **Supabase direct** (web) + **WatermelonDB** (iOS) - Database  
✅ **Layered voice testing** - Mock transcripts → Mock API → Real voice  

---

## 🏗️ Technology Stack

### **Frontend**
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Expo | ~53.0.0 | React Native framework |
| **React** | React | 18.3.1 | UI library |
| **React Native** | React Native | 0.79.0 | Mobile framework |
| **Web Support** | react-native-web | ~0.19.12 | Web testing |
| **UI Library** | Gluestack UI v3 | ^3.0.0 | Component library |
| **Styling** | NativeWind | ^4.1.0 | Tailwind for RN |
| **Styling** | Tailwind CSS | ^3.4.0 | Utility-first CSS |
| **Navigation** | React Navigation | ^6.1.9 | 5-tab bottom nav |
| **State** | Zustand | ^4.5.0 | Global state |
| **Animations** | Reanimated | ~3.15.0 | UI thread animations |
| **Gestures** | Gesture Handler | ~2.18.0 | Touch interactions |
| **Charts** | Victory Native XL | ^41.4.0 | Performance charts |
| **Icons** | lucide-react-native | Latest | Icon library |

### **Backend & Database**
| Category | Technology | Purpose |
|----------|-----------|---------|
| **Backend** | Supabase PostgreSQL | Production database (both platforms) |
| **Local (Web)** | Supabase direct | No local storage needed |
| **Local (iOS)** | WatermelonDB | Offline-first SQLite |
| **Vector Search** | pgvector | Exercise semantic search |
| **API** | FastAPI (Python) | Voice parsing API (EXISTING) |

### **Testing**
| Category | Technology | Purpose |
|----------|-----------|---------|
| **Unit** | Jest + RTL | Component/logic tests |
| **E2E (Web)** | Playwright | Web testing |
| **E2E (iOS)** | Detox | iOS testing |
| **Voice Mocking** | Custom mocks | Automated voice tests |

---

## 🎨 Design System (Figma → Tailwind)

**Current Compliance:** 95% (up from 72%)
**Last Audit:** January 2025
**Status:** All 4 phases of UI audit complete

### **📚 Authoritative Design System Documentation**

**For all UI development, reference these documents:**

1. **[docs/design/DESIGN_SYSTEM_GUIDE.md](docs/design/DESIGN_SYSTEM_GUIDE.md)** - **Developer Quick-Start**
   - Component patterns and code examples
   - Common use cases and troubleshooting
   - Theme system usage

2. **[docs/design/FIGMA_EXTRACTED_DESIGN_SYSTEM.md](docs/design/FIGMA_EXTRACTED_DESIGN_SYSTEM.md)** - **Complete Specification**
   - 115 design variables from Figma
   - All color tokens, typography, spacing, shadows
   - Single source of truth for design values

3. **[docs/design/COMPREHENSIVE_UI_AUDIT.md](docs/design/COMPREHENSIVE_UI_AUDIT.md)** - **Compliance Status**
   - Current 95% compliance score
   - File-by-file compliance analysis
   - Implementation verification

4. **[docs/design/COMPREHENSIVE_UI_AUDIT_ACTION_PLAN.md](docs/design/COMPREHENSIVE_UI_AUDIT_ACTION_PLAN.md)** - **Implementation Guide**
   - All 4 phases complete (Critical Fixes, High Priority, Medium Priority, Polish)
   - Code examples and best practices
   - Testing and verification results

### **Color Palette (Quick Reference)**

**See [FIGMA_EXTRACTED_DESIGN_SYSTEM.md](docs/design/FIGMA_EXTRACTED_DESIGN_SYSTEM.md) for complete color specifications.**

```javascript
// Implemented in apps/mobile/tailwind.config.js
colors: {
  // Brand Colors (Light/Dark)
  primary: { 500: '#2C5F3D', 600: '#234A31' },
  primaryDark: '#4A9B6F',
  secondary: { 500: '#DD7B57', 600: '#C76B47' },
  secondaryDark: '#F9AC60',
  accent: { 500: '#36625E', 600: '#2D504C' },
  accentDark: '#86F4EE',

  // Semantic Colors
  success: { light: '#4A9B6F', dark: '#5DB88A' },
  warning: { light: '#F9AC60', dark: '#FFB84D' },
  error: { light: '#E74C3C', dark: '#FF6B6B' },
  info: { light: '#3498DB', dark: '#5DADE2' },

  // Grays (Standardized)
  gray: {
    50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB',
    300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280',
    600: '#4B5563', 700: '#374151', 800: '#1F2937',
    900: '#111827',
  },
}
```

### **Typography**

**See [DESIGN_SYSTEM_GUIDE.md](docs/design/DESIGN_SYSTEM_GUIDE.md) for usage examples.**

- **Font Family:** Inter (Regular/Medium/SemiBold/Bold)
- **Font Weights:** body (400), body-medium (500), body-semibold (600), heading (700)
- **Sizes:** xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px), 3xl (30px), 4xl (36px)

### **Spacing & Layout**

- **Base Unit:** 4px
- **Tokens:** xs (4px), sm (8px), md (16px), lg (24px), xl (32px)
- **Border Radius:** 16px (rounded-xl) - standardized across all components
- **Shadows:** sm, md, lg, xl, 2xl elevation tokens

### **Touch Targets & Accessibility**

- **Primary Actions:** 60pt (gym-optimized for sweaty hands)
- **Minimum (WCAG AA):** 44pt
- **Recommended (WCAG AAA):** 48pt
- **Color Contrast:** All colors meet WCAG AA standards (4.5:1 for text, 3:1 for large text)

### **Design System Compliance Requirements**

Each phase must maintain or improve design system compliance:

- ✅ **Phase 1:** Tailwind config with all design tokens
- ✅ **Phase 2:** Design system colors and spacing
- ✅ **Phase 3:** Design consistency in voice components
- ✅ **Phase 4:** iOS components follow design system
- ✅ **Phase 5:** Native features use design tokens
- ✅ **Phase 6:** 95% compliance achieved (all 4 audit phases complete)
- ✅ **Phase 7:** Design system validation in final testing

---

## 📱 Navigation Architecture

### **5-Tab Bottom Navigation**
```
┌─────────────────────────────────────────┐
│  Home  │  Log  │  START  │  PRs  │ Coach│
└─────────────────────────────────────────┘
```

1. **Home** 🏠 - Daily overview + readiness check
2. **Log** 📊 - Workout history + analytics
3. **START** ➕ - PRIMARY ACTION (center, 1.5x size)
4. **PRs** 🏆 - Personal records
5. **Coach** 💬 - AI chat + settings

---

## 🗂️ Phase Breakdown

This project is divided into **7 phases**, each designed to be standalone and executable by different teams:

### **Phase 1: Foundation & Setup** ✅ COMPLETE (Week 1)
- ✅ Initialize Expo project with SDK 53
- ✅ Configure Gluestack UI v3 + NativeWind
- ✅ Set up Tailwind with Figma design tokens
- ✅ Create basic navigation (5 tabs)
- ✅ Configure TypeScript + ESLint
- **Deliverable:** Running app with empty screens

### **Phase 2: Web Development & Testing Infrastructure** ✅ COMPLETE (Weeks 2-3)
- ✅ Build core screens (Home, Log, START, PRs, Coach)
- ✅ Implement Zustand stores
- ✅ Set up Supabase client (web)
- ✅ Create platform abstraction layer
- ✅ Configure Playwright for E2E testing
- **Deliverable:** Functional web app with tests

### **Phase 3: Voice Processing (Web)** ✅ COMPLETE (Week 4)
- ✅ Implement keyboard-based voice input (testing)
- ✅ Build VoiceParser logic
- ✅ Create ExerciseResolver (3-tier search)
- ✅ Mock Web Speech API for E2E tests
- **Deliverable:** Voice logging works on web

### **Phase 4: iOS Migration** ✅ COMPLETE (2025-11-05)
- ✅ iOS build working (React Native 0.79.6 + React 19.0.0 + Expo SDK 53)
- ✅ Apple Speech Framework integrated (@react-native-voice/voice)
- ✅ WatermelonDB offline storage configured
- ✅ Supabase sync service implemented
- ✅ expo-haptics integrated
- ✅ Detox E2E testing configured
- ⏭️ Physical device testing (deferred to Phase 7)
- ⏭️ Comprehensive E2E tests (deferred to Phase 7)
- **Deliverable:** iOS app builds and runs on simulator
- **See:** [PHASE_4_COMPLETE.md](PHASE_4_COMPLETE.md)

### **Phase 5: iOS Native Features** (Week 7) - OPTION 1
- GPS tracking (expo-location)
- Voice recognition tuning
- Performance optimization (60fps)
- Battery usage testing
- **Deliverable:** Full-featured iOS app

### **Phase 6: Polish & Advanced Features** (Week 8) - RECOMMENDED NEXT
- **Figma UI implementation** (complete design system)
- Animations (Reanimated 3.x)
- Dark mode
- Charts (Victory Native XL)
- Accessibility (WCAG 2.1 AA)
- **Deliverable:** Production-ready UI
- **Note:** Should be done before Phase 5 to have complete UI for testing

### **Phase 7: Testing & Launch** (Weeks 9-10)
- **Physical iPhone testing** (voice, haptics, offline sync - deferred from Phase 4)
- **Comprehensive Detox E2E tests** (deferred from Phase 4)
- TestFlight beta
- Bug fixes
- Performance tuning
- **Deliverable:** App Store submission
- **See:** [PHASE_7_LAUNCH.md](docs/PHASE_7_LAUNCH.md) for deferred tasks

---

## 📊 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| App cold start | <2s | First screen visible |
| Voice recognition | <3s | Speak → confirmed log |
| Visual feedback | <200ms | Button press → response |
| Chart rendering | <500ms | 30-day data |
| Voice accuracy (quiet) | >90% | Controlled environment |
| Voice accuracy (gym) | >75% | Noisy environment |
| Sync success rate | >99% | Offline → online |
| Crash-free rate | >99.5% | Production stability |
| Battery (workout) | <10%/hr | Active workout |
| Battery (run + GPS) | <15%/hr | GPS tracking |

---

## 🔄 Development Workflow (Web-First)

```
1. Build feature on WEB
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

**Why Web-First:**
- ✅ Faster iteration (instant hot reload)
- ✅ Better debugging (Chrome DevTools)
- ✅ Easier E2E testing (Playwright > Detox flakiness)
- ✅ Team velocity (designers preview in browser)
- ✅ CI/CD simplicity (30s builds vs 5-10min)

---

## 🎯 Next Steps

1. **Review this plan** - Confirm all decisions
2. **Execute Phase 1** - See `/phases/PHASE_1_FOUNDATION.md`
3. **Create GitHub repo** - Initialize version control
4. **Set up CI/CD** - GitHub Actions for testing

---

## 📚 Related Documents

- **phases/PHASE_1_FOUNDATION.md** - Week 1 setup guide
- **phases/PHASE_2_WEB_DEVELOPMENT.md** - Weeks 2-3 web app
- **phases/PHASE_3_VOICE_PROCESSING.md** - Week 4 voice features
- **phases/PHASE_4_IOS_MIGRATION.md** - Weeks 5-6 iOS port
- **phases/PHASE_5_IOS_NATIVE.md** - Week 7 native features
- **phases/PHASE_6_POLISH.md** - Week 8 polish
- **phases/PHASE_7_LAUNCH.md** - Weeks 9-10 launch

- **VF Technical.md** - Complete technical architecture
- **COMPREHENSIVE_UI_IMPLEMENTATION_PLAN.md** - UI/UX details
- **FIGMA_TO_VOICEFIT_COMPONENT_MAP.md** - Figma → Component mapping
- **DESIGN_TOKENS_AND_THEME.md** - Design system details

---

**Ready to begin? Start with Phase 1!** 🚀

