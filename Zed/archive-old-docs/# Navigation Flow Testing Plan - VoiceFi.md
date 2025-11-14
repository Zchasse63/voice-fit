# Navigation Flow Testing Plan - VoiceFit UI Redesign

**Date**: January 2025  
**Phase**: Phases 4-6 Testing  
**Focus**: Testing navigation flows against live Railway backend  
**Status**: 🟢 READY TO IMPLEMENT

---

## 📋 Executive Summary

This document outlines a comprehensive testing strategy for validating all navigation flows in the VoiceFit app (Phases 4-6). We'll use **Maestro** as the primary testing framework, testing against the **live Railway backend** with real test user accounts.

### Quick Facts
- ✅ Navigation wiring is complete (RootNavigator + AuthNavigator)
- ✅ All 7 redesigned screens are wired
- ✅ Live Railway backend is available
- ✅ 2 test user accounts exist with seeded data
- ✅ Using Maestro for E2E testing
- ✅ Testing critical user flows (auth, tabs, navigation)

---

## 🎯 Testing Objectives

### Primary Goals
1. ✅ Verify auth flow works (signup, signin, signout)
2. ✅ Verify all tab navigation works (Home, Coach, Run)
3. ✅ Verify navigation between screens within each tab
4. ✅ Verify modal navigation (Profile, WorkoutLog)
5. ✅ Verify data persists across navigation
6. ✅ Verify back button behavior
7. ✅ Verify deep linking (future enhancement)

### Secondary Goals
1. ✅ Test dark mode toggle during navigation
2. ✅ Test error handling during navigation
3. ✅ Test gesture navigation (swipe back)
4. ✅ Test navigation state on app restart

---

## 🏗️ Navigation Architecture Review

### Current Structure

```
App.tsx
├── OnboardingScreen (first time only)
├── AuthNavigator (when !user)
│   ├── SignInScreenRedesign
│   └── SignUpScreenRedesign
└── RootNavigator (when user exists)
    ├── HomeStackNavigator
    │   ├── HomeScreenRedesign (main)
    │   ├── AnalyticsScreen
    │   ├── ProfileScreenRedesign (modal)
    │   └── LogScreenRedesign
    │
    ├── ChatStackNavigator
    │   ├── ChatScreenRedesign (main)
    │   └── ProfileScreenRedesign (modal)
    │
    └── RunStackNavigator
        ├── RunScreenRedesign (main)
        └── ProfileScreenRedesign (modal)
```

### Key Navigation Concepts

1. **Tab Navigation**: Bottom tabs for Home, Coach (Chat), Run
2. **Stack Navigation**: Each tab has its own stack for sub-navigation
3. **Modal Navigation**: Profile and WorkoutLog use modal presentation
4. **Auth State**: App conditionally renders based on authentication
5. **Onboarding**: One-time flow on first app launch

---

## 🧪 Test Coverage Matrix

### Auth Flow Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Signup with new email | Navigate to Home | Navigation | 🔴 Critical |
| Signup with invalid email | Show error, stay on signup | Validation | 🔴 Critical |
| Signin with valid account | Navigate to Home | Navigation | 🔴 Critical |
| Signin with wrong password | Show error, stay on signin | Validation | 🔴 Critical |
| Signout from profile | Navigate to SignIn | Navigation | 🔴 Critical |
| Swipe back on signup | Navigate to signin | Gesture | 🟡 High |
| Cannot swipe back on signin | Stay on signin | Gesture | 🟡 High |

### Tab Navigation Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Tap Home tab | Show HomeScreenRedesign | Navigation | 🔴 Critical |
| Tap Coach tab | Show ChatScreenRedesign | Navigation | 🔴 Critical |
| Tap Run tab | Show RunScreenRedesign | Navigation | 🔴 Critical |
| Switch between tabs | Each tab preserves state | State | 🔴 Critical |
| Tab bar visible on all screens | Tab bar present | UI | 🟡 High |
| Active tab indicator changes | Correct tab highlighted | UI | 🟡 High |

### Home Tab Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Tap avatar button | Profile modal opens | Navigation | 🔴 Critical |
| Dismiss profile modal | Return to home | Navigation | 🔴 Critical |
| Tap analytics card | Navigate to analytics | Navigation | 🔴 Critical |
| Back from analytics | Return to home | Navigation | 🔴 Critical |
| Tap "View All" | Navigate to log | Navigation | 🔴 Critical |
| Back from log | Return to home | Navigation | 🔴 Critical |
| Tap metric card | Stay on home | UI | 🟡 High |

### Chat Tab Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Chat screen loads | Messages visible | UI | 🟡 High |
| Tap menu button | Profile modal opens | Navigation | 🔴 Critical |
| Dismiss profile modal | Return to chat | Navigation | 🔴 Critical |
| Send message | Message appears in chat | Integration | 🟡 High |
| Receive AI response | Response appears | Integration | 🟡 High |

### Run Tab Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Run screen loads | Goal selection visible | UI | 🟡 High |
| Select goal | Enter active run mode | Navigation | 🔴 Critical |
| Back from active mode | Return to goal selection | Navigation | 🔴 Critical |
| Map displays | Map visible in active mode | UI | 🟡 High |
| Stats update | Live stats visible | Integration | 🟡 High |

### Profile Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Profile opens from Home | Profile modal visible | Navigation | 🔴 Critical |
| Profile opens from Chat | Profile modal visible | Navigation | 🔴 Critical |
| Profile opens from Run | Profile modal visible | Navigation | 🔴 Critical |
| Toggle dark mode | App updates colors | State | 🟡 High |
| Tap signout | Navigate to signin | Navigation | 🔴 Critical |
| Close profile modal | Return to previous screen | Navigation | 🔴 Critical |

### State Persistence Tests
| Test Case | Expected Result | Test Type | Priority |
|-----------|-----------------|-----------|----------|
| Navigate away from home | Home stack state preserved | State | 🟡 High |
| Switch tabs | Tab state preserved | State | 🟡 High |
| Return to tab | Previous state restored | State | 🟡 High |
| Restart app | Auth state persists | State | 🟡 High |

---

## 🚀 Testing Implementation Strategy

### Phase 1: Core Auth Flow Tests (Week 1)
**Duration**: 2-3 days  
**Focus**: Getting authentication working reliably

Tests to implement:
- `auth-signup.yaml` - New user signup flow
- `auth-signin.yaml` - Returning user signin flow  
- `auth-signout.yaml` - User signout flow
- `auth-invalid-email.yaml` - Error handling

### Phase 2: Tab Navigation Tests (Week 1)
**Duration**: 2-3 days  
**Focus**: Verifying all tabs work and state persists

Tests to implement:
- `nav-home-tab.yaml` - Home tab navigation
- `nav-chat-tab.yaml` - Chat tab navigation
- `nav-run-tab.yaml` - Run tab navigation
- `nav-tab-switching.yaml` - Tab switching and state preservation

### Phase 3: Screen-Specific Tests (Week 2)
**Duration**: 3-4 days  
**Focus**: Deep testing of each screen's navigation

Tests to implement:
- `home-analytics-flow.yaml` - Home → Analytics
- `home-log-flow.yaml` - Home → Log
- `home-profile-flow.yaml` - Profile modal from Home
- `chat-profile-flow.yaml` - Profile modal from Chat
- `run-profile-flow.yaml` - Profile modal from Run

### Phase 4: Advanced Tests (Week 2-3)
**Duration**: 3-4 days  
**Focus**: Edge cases and complex scenarios

Tests to implement:
- `nav-error-handling.yaml` - Navigation during errors
- `nav-dark-mode.yaml` - Navigation with dark mode
- `nav-state-persistence.yaml` - App restart state
- `nav-gesture-navigation.yaml` - Swipe back gestures

---

## 📱 Test Environment Setup

### Test User Accounts (Railway)

**Account 1: Basic User**
- Email: `test-basic@voicefit.com`
- Password: `TestPassword123!`
- Seeded Data: Profile, workouts, chat history

**Account 2: Advanced User**
- Email: `test-advanced@voicefit.com`
- Password: `TestPassword123!`
- Seeded Data: Profile, multiple workouts, chat history, analytics data

### Environment Variables

```bash
# .env.test (local testing)
RAILWAY_API_URL=https://voicefit-api.up.railway.app
RAILWAY_WEBSOCKET_URL=wss://voicefit-api.up.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Device/Simulator Configuration

- **iOS**: iPhone 17 Pro Max (iOS 18)
- **Android**: Pixel 8 (Android 15)
- Both in light and dark modes

---

## 🎬 Maestro Test Format

### Basic Test Structure

```yaml
appId: com.voicefit.app  # Production bundle ID
env:
  TEST_EMAIL: test-${TIMESTAMP}@voicefit.com
  TEST_PASSWORD: TestPassword123!
---
- launchApp
- assertVisible: "Expected Screen Title"
- tapOn: "Button Text"
- inputText: "user input"
- assertVisible: "Result Screen"
```

### Environment-Specific Configuration

```yaml
# maestro/config.yaml
appId: com.voicefit.app
platformName: iOS  # or Android
osVersion: 18  # iOS version
deviceType: iPhone  # or iPad, Android, etc.
env:
  RAILWAY_API_URL: https://voicefit-api.up.railway.app
  TEST_TIMEOUT: 10000
```

---

## 📊 Test Execution Plan

### Local Testing (Developer)
```bash
# Run single test
maestro test maestro/auth-signup.yaml

# Run all tests
maestro test maestro/

# Run with specific device
maestro test maestro/ --device "iPhone 17 Pro Max"

# Run with logging
maestro test maestro/ --log-level DEBUG
```

### CI/CD Testing (GitHub Actions)
```yaml
# .github/workflows/navigation-tests.yaml
name: Navigation Tests
on: [pull_request, push]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Maestro tests
        run: |
          brew tap mobile-dev-inc/tap
          brew install maestro
          maestro test maestro/
```

---

## 🔍 Test Execution Order

### Recommended Test Order (Dependencies)

1. **Auth Tests First** (required for all other tests)
   ```
   auth-signup.yaml → auth-signin.yaml → auth-signout.yaml
   ```

2. **Tab Navigation Tests** (basic navigation)
   ```
   nav-home-tab.yaml → nav-chat-tab.yaml → nav-run-tab.yaml
   ```

3. **Screen Navigation Tests** (building on tab nav)
   ```
   home-analytics-flow.yaml → home-log-flow.yaml → home-profile-flow.yaml
   ```

4. **Advanced Tests** (all features working)
   ```
   nav-error-handling.yaml → nav-dark-mode.yaml → nav-gesture-navigation.yaml
   ```

### Parallel Execution (Optional)

With Maestro Cloud or Detox, can run tests in parallel:
```
[auth-signup]  [nav-home-tab]  [nav-chat-tab]
      ↓              ↓               ↓
[auth-signin] [home-analytics] [chat-profile]
      ↓              ↓               ↓
[home-profile] [home-log]    [run-profile]
```

---

## ✅ Success Criteria

### Test Success = All of:
- ✅ Navigation occurs without crashes
- ✅ Expected screen appears after navigation
- ✅ Back button works correctly
- ✅ State is preserved when appropriate
- ✅ Error messages appear for invalid actions
- ✅ No unexpected errors in logs
- ✅ Modal dismisses correctly
- ✅ Data loads from live backend

### Acceptable Flakiness
- Tests should pass 100% of the time
- If test fails >10% of the time, investigate root cause
- Retry up to 2 times before marking as failure

---

## 🐛 Debugging & Troubleshooting

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot find element" | Element not visible | Add wait, check screen loaded |
| "Network timeout" | Railway not responsive | Check Railway status, network |
| "Auth failed" | Wrong credentials | Verify test account exists |
| "Modal doesn't close" | Swipe gesture failed | Try tapOn close button instead |
| "Test flaky" | Timing issue | Add explicit waits, retry logic |
| "Dark mode colors off" | Not waiting for theme | Add wait after toggling dark mode |

### Maestro Debugging Commands

```bash
# Run test with verbose output
maestro test maestro/auth-signup.yaml --log-level VERBOSE

# Record test for visual debugging
maestro test maestro/auth-signup.yaml --record

# Run against specific device
maestro test maestro/ --device "specific-device-id"

# Check device connectivity
maestro devices
```

---

## 📈 Testing Timeline & Milestones

### Week 1: Foundation
- [ ] Day 1: Install Maestro, set up environment
- [ ] Day 1: Write and verify auth signup test
- [ ] Day 2: Write and verify auth signin test
- [ ] Day 2: Write and verify tab navigation tests
- [ ] Day 3: Write and verify home screen tests
- [ ] Day 4: Write and verify chat screen tests
- [ ] Day 5: Write and verify run screen tests

**Milestone**: ✅ All critical navigation flows tested

### Week 2: Enhancement
- [ ] Day 1: Write profile navigation tests
- [ ] Day 2: Write error handling tests
- [ ] Day 2: Write dark mode navigation tests
- [ ] Day 3: Write state persistence tests
- [ ] Day 3: Write gesture navigation tests
- [ ] Day 4: Review and optimize tests
- [ ] Day 5: Set up CI/CD

**Milestone**: ✅ Comprehensive navigation coverage

### Week 3: Polish & Optimization
- [ ] Day 1: Add timeout handling
- [ ] Day 2: Add retry logic
- [ ] Day 2: Optimize test execution time
- [ ] Day 3: Document test patterns
- [ ] Day 4: Team training on Maestro
- [ ] Day 5: Create test documentation

**Milestone**: ✅ Robust, maintainable test suite

---

## 📚 Documentation Artifacts

### To Create
1. **Maestro Test Suite** (`maestro/`)
   - All YAML test files organized by flow
   - Configuration files
   - Fixtures and data

2. **Testing Documentation**
   - Test execution guide
   - Debugging guide
   - Best practices guide
   - CI/CD configuration

3. **Test Reports**
   - Weekly test execution reports
   - Failure analysis
   - Coverage metrics

---

## 🔗 Integration Points

### With Railway Backend
- Tests run against live Railway API
- Uses real test user accounts
- Tests chat, workouts, analytics data
- Tests real-time updates

### With Zustand Store
- Tests verify state updates
- Tests verify state persistence
- Tests verify dark mode state

### With WatermelonDB
- Tests verify offline data
- Tests verify sync behavior
- Tests verify data persistence

---

## ⚠️ Known Limitations & Workarounds

### Maestro Limitations
1. **Cannot access component state** → Verify via UI elements
2. **No precise gesture timing** → Use basic swipe/tap
3. **Limited error messages** → Use device logs for debugging

### Workarounds
1. Use visual assertions (check text, elements)
2. Add explicit wait times
3. Check device console for actual errors
4. Record videos of test runs for analysis

---

## 🎓 Team Onboarding

### Prerequisites
- Access to Railway staging environment
- Test user account credentials
- iOS simulator or Android emulator running
- Maestro installed locally

### Training Materials
1. Maestro basics (30 min)
2. VoiceFit navigation structure (15 min)
3. Writing first test (30 min)
4. Running and debugging tests (30 min)
5. CI/CD workflow (15 min)

### Resources
- Maestro docs: https://maestro.mobile.dev/
- VoiceFit navigation docs: NAVIGATION_WIRING_COMPLETE.md
- This guide: NAVIGATION_FLOW_TESTING_PLAN.md

---

## 📊 Success Metrics

### Coverage Metrics
- ✅ Auth flows: 100% coverage
- ✅ Tab navigation: 100% coverage
- ✅ Screen navigation: 100% coverage
- ✅ Error paths: 80% coverage
- ✅ Edge cases: 70% coverage

### Quality Metrics
- ✅ Test pass rate: >95%
- ✅ False positive rate: <5%
- ✅ Average test duration: <30 seconds
- ✅ E2E suite duration: <5 minutes

### Team Metrics
- ✅ All team members can write tests
- ✅ New tests added within 1 day
- ✅ Test maintenance <2 hours/week
- ✅ Onboarding time <2 hours

---

## 🚀 Next Steps

### Immediate Actions (Today)
1. [ ] Review this testing plan
2. [ ] Verify test user accounts on Railway
3. [ ] Install Maestro locally
4. [ ] Set up Maestro project structure
5. [ ] Write first test (auth signup)

### This Week
1. [ ] Complete all critical path tests
2. [ ] Run tests locally on all platforms
3. [ ] Document any issues found
4. [ ] Fix any navigation bugs
5. [ ] Set up CI/CD

### Next Week
1. [ ] Expand test coverage
2. [ ] Add advanced test scenarios
3. [ ] Optimize test performance
4. [ ] Train team on testing
5. [ ] Plan SSO testing

---

## 📞 Support & Contact

### Maestro Resources
- **Official Docs**: https://maestro.mobile.dev/
- **Discord Community**: https://discord.gg/maestro
- **GitHub Issues**: https://github.com/mobile-dev-inc/maestro/issues

### VoiceFit Resources
- **Navigation Wiring**: NAVIGATION_WIRING_COMPLETE.md
- **Testing Strategy**: E2E_TESTING_STRATEGY.md
- **Phase Summary**: PHASE_4_5_6_COMPLETE.md

---

## 📝 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Engineering | Initial plan |

---

**Status**: 🟢 READY FOR IMPLEMENTATION  
**Priority**: 🔴 CRITICAL (Required for Phase 4-6 validation)  
**Timeline**: 3 weeks to full coverage  
**Next Step**: Install Maestro and write first test

---

**Last Updated**: January 2025  
**Next Review**: After Week 1 testing  
**Owner**: Development Team