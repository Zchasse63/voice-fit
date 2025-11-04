# Voice Fit - Master Implementation Plan

**Version:** 1.0  
**Date:** November 4, 2025  
**Status:** Ready for Phase 1 Execution

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

### **Color Palette**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      // Light Mode
      background: {
        light: '#FBF7F5',
        dark: '#1A1A1A',
      },
      primary: {
        500: '#2C5F3D',  // Forest Green
        600: '#234A31',
      },
      secondary: {
        500: '#DD7B57',  // Terracotta
      },
      accent: {
        500: '#36625E',  // Deep Teal
      },
      // Dark Mode
      primaryDark: '#4A9B6F',
      secondaryDark: '#F9AC60',
      accentDark: '#86F4EE',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    fontFamily: {
      heading: ['Inter-Bold'],
      body: ['Inter-Regular'],
    },
  },
};
```

### **Typography**
- **h1:** 32px, Bold
- **h2:** 28px, Bold
- **h3:** 24px, Bold
- **body:** 16px, Regular
- **caption:** 12px, Regular

### **Touch Targets**
- **Primary:** 60pt (gym-optimized for sweaty hands)
- **Minimum:** 44pt (Apple HIG)

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

### **Phase 1: Foundation & Setup** (Week 1)
- Initialize Expo project with SDK 53
- Configure Gluestack UI v3 + NativeWind
- Set up Tailwind with Figma design tokens
- Create basic navigation (5 tabs)
- Configure TypeScript + ESLint
- **Deliverable:** Running app with empty screens

### **Phase 2: Web Development & Testing Infrastructure** (Weeks 2-3)
- Build core screens (Home, Log, START, PRs, Coach)
- Implement Zustand stores
- Set up Supabase client (web)
- Create platform abstraction layer
- Configure Playwright for E2E testing
- **Deliverable:** Functional web app with tests

### **Phase 3: Voice Processing (Web)** (Week 4)
- Implement keyboard-based voice input (testing)
- Build VoiceParser logic
- Create ExerciseResolver (3-tier search)
- Mock Web Speech API for E2E tests
- **Deliverable:** Voice logging works on web

### **Phase 4: iOS Migration** (Weeks 5-6)
- Replace keyboard → Apple Speech API
- Add WatermelonDB (offline storage)
- Implement Supabase sync
- Add expo-haptics
- Configure Detox for iOS testing
- **Deliverable:** iOS app with voice + offline

### **Phase 5: iOS Native Features** (Week 7)
- GPS tracking (expo-location)
- Voice recognition tuning
- Performance optimization (60fps)
- Battery usage testing
- **Deliverable:** Full-featured iOS app

### **Phase 6: Polish & Advanced Features** (Week 8)
- Animations (Reanimated 3.x)
- Dark mode
- Charts (Victory Native XL)
- Accessibility (WCAG 2.1 AA)
- **Deliverable:** Production-ready UI

### **Phase 7: Testing & Launch** (Weeks 9-10)
- Maestro E2E tests (iOS)
- TestFlight beta
- Bug fixes
- Performance tuning
- **Deliverable:** App Store submission

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

