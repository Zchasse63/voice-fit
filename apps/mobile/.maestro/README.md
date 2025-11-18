# VoiceFit Mobile - Maestro E2E Test Suite

Comprehensive end-to-end test suite for the VoiceFit iOS mobile application using Maestro.

## Overview

This test suite provides automated E2E testing for the VoiceFit mobile app, covering all core user journeys including authentication, workout tracking, AI coach interactions, voice input, profile management, and error handling.

## Prerequisites

- **Maestro CLI** (v2.0.10 or higher)
- **Xcode** with iOS Simulator
- **Node.js** and npm (for running the mobile app)
- **Java/OpenJDK** (required by Maestro)

## Installation

### Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Verify Installation

```bash
maestro --version
```

### Start iOS Simulator

```bash
open -a Simulator
```

Or use Xcode to launch your preferred simulator device.

## Test Suite Structure

```
.maestro/
├── 00-onboarding.yaml        # New user signup and onboarding
├── 01-login.yaml             # User authentication
├── 02-ai-coach.yaml          # AI coach chat functionality
├── 03-workout-tracking.yaml  # Workout/run tracking features
├── 04-voice-interaction.yaml # Voice input and commands
├── 05-profile-settings.yaml  # Profile and settings management
├── 06-error-handling.yaml    # Error states and validation
├── 07-navigation.yaml        # Navigation patterns and deep linking
├── 08-workout-programs.yaml  # Workout programs and AI plans
├── run-all-tests.sh          # Test runner script
└── README.md                 # This file
```

## Running Tests

### Run All Tests

```bash
./apps/mobile/.maestro/run-all-tests.sh
```

Or:

```bash
cd apps/mobile/.maestro
./run-all-tests.sh
```

### Run Specific Test Suites

```bash
# Smoke tests (core functionality only)
./run-all-tests.sh smoke

# Individual test flows
./run-all-tests.sh login
./run-all-tests.sh coach
./run-all-tests.sh workout
./run-all-tests.sh voice
./run-all-tests.sh profile
./run-all-tests.sh errors
./run-all-tests.sh navigation
./run-all-tests.sh programs
```

### Run Single Test File

```bash
maestro test 01-login.yaml
```

### Run with Specific Device

```bash
MAESTRO_DEVICE_ID="YOUR_DEVICE_ID" ./run-all-tests.sh
```

## Test Descriptions

### 00-onboarding.yaml
- **Purpose**: Verify new user registration and onboarding flow
- **Coverage**:
  - Account creation with email/password
  - Form validation
  - Onboarding screen navigation
  - First-time user experience
- **Duration**: ~45 seconds

### 01-login.yaml
- **Purpose**: Verify user authentication
- **Coverage**:
  - Email/password login
  - Navigation to main app
  - Session establishment
- **Test Account**: test@voicefit.app / TestUser2025!
- **Duration**: ~20 seconds

### 02-ai-coach.yaml
- **Purpose**: Test AI coach chat functionality
- **Coverage**:
  - Chat interface interaction
  - Message sending
  - AI response handling
  - Message history
- **Duration**: ~60 seconds

### 03-workout-tracking.yaml
- **Purpose**: Test workout and run tracking features
- **Coverage**:
  - Starting/stopping workouts
  - Pause/resume functionality
  - Workout summary
  - History viewing
- **Duration**: ~90 seconds

### 04-voice-interaction.yaml
- **Purpose**: Verify voice input and interaction
- **Coverage**:
  - Voice recording initiation
  - Recording cancellation
  - Voice message sending
  - Voice command handling during workouts
- **Duration**: ~60 seconds

### 05-profile-settings.yaml
- **Purpose**: Test profile and settings management
- **Coverage**:
  - Profile editing
  - Settings navigation
  - Notification preferences
  - Units and preferences
  - Account management options
- **Duration**: ~75 seconds

### 06-error-handling.yaml
- **Purpose**: Verify error states and validation
- **Coverage**:
  - Invalid login credentials
  - Form validation errors
  - Empty state handling
  - Network error handling
  - Session management
- **Duration**: ~90 seconds

### 07-navigation.yaml
- **Purpose**: Test navigation patterns
- **Coverage**:
  - Bottom tab navigation
  - Navigation state preservation
  - Deep navigation within tabs
  - Modal/sheet navigation
  - Back button behavior
  - Deep linking
- **Duration**: ~120 seconds

### 08-workout-programs.yaml
- **Purpose**: Test workout programs and AI-generated plans
- **Coverage**:
  - Program browsing and enrollment
  - AI-generated plan creation
  - Program workout execution
  - Progress tracking
  - Program management
- **Duration**: ~150 seconds

## Test Data

### Test Accounts

| Email | Password | Purpose | Data |
|-------|----------|---------|------|
| test@voicefit.app | TestUser2025! | Primary test account | 1,280 items |
| test-ai-program-2@voicefit.app | TestUser2025! | AI program testing | 721 items |
| zchasse89@gmail.com | (personal) | Personal account | Production data |

### Test Environment

- **Backend**: Railway (https://voicefit-backend.railway.app)
- **Database**: Supabase
- **App ID**: com.voicefit.app

## Best Practices

### Before Running Tests

1. **Ensure app is built**: Build the app in Xcode or via Expo
2. **Check simulator**: iOS Simulator should be running and responsive
3. **Verify backend**: Ensure Railway backend is accessible
4. **Clean state**: For consistent results, reset app state between full test runs

### Writing New Tests

1. **Use meaningful selectors**: Prefer `id` or unique text over generic labels
2. **Add optional flags**: Use `optional: true` for elements that may not always appear
3. **Set appropriate timeouts**: Balance between test speed and reliability
4. **Handle async operations**: Use `extendedWaitUntil` for operations that take time
5. **Test both success and failure**: Include error paths and edge cases

### Test Maintenance

1. **Update selectors**: When UI changes, update test selectors accordingly
2. **Keep tests independent**: Each test should work standalone
3. **Use test data accounts**: Never use production accounts for automated tests
4. **Document changes**: Update this README when adding new tests

## Troubleshooting

### Common Issues

#### "App not found" Error
```bash
# Ensure app is installed on simulator
# Rebuild and reinstall the app
cd apps/mobile
npm run ios
```

#### Tests Timing Out
- Increase timeout values in test files
- Check if backend is responding (Railway might be sleeping)
- Verify simulator performance (restart if sluggish)

#### Element Not Found
- Use Maestro Studio to inspect UI hierarchy: `maestro studio`
- Check if element ID/text has changed
- Verify element is visible (not hidden or off-screen)

#### Network Errors in AI Coach Tests
- Railway backend may need to warm up (first request can be slow)
- Check Railway deployment status
- Verify environment variables are set correctly

### Debugging Tests

#### Run with Maestro Studio
```bash
maestro studio
```

This opens an interactive UI where you can:
- Inspect element hierarchy
- Test selectors in real-time
- Debug failing assertions

#### Enable Verbose Logging
```bash
maestro test --debug 01-login.yaml
```

#### Take Screenshots on Failure
Add to test files:
```yaml
- runScript: maestro screenshot failure_${timestamp}.png
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Maestro E2E Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH
      
      - name: Build iOS app
        run: |
          cd apps/mobile
          npm run ios:build
      
      - name: Run Maestro tests
        run: |
          cd apps/mobile/.maestro
          ./run-all-tests.sh smoke
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: maestro-results
          path: ~/.maestro/tests/
```

## Test Coverage Goals

- ✅ Authentication (login, signup, logout)
- ✅ Core navigation (tabs, screens, back button)
- ✅ Workout tracking (start, pause, complete)
- ✅ AI coach interaction (chat, voice)
- ✅ Profile management (settings, preferences)
- ✅ Error handling (validation, network errors)
- ✅ Workout programs (enrollment, AI generation)
- 🔲 Live Activities (requires real device)
- 🔲 HealthKit integration (requires permissions)
- 🔲 Notifications (push, local)
- 🔲 Offline mode
- 🔲 Data sync

## Contributing

When adding new test flows:

1. Follow the naming convention: `##-feature-name.yaml`
2. Add test to `run-all-tests.sh`
3. Update this README with test description
4. Ensure test can run independently
5. Test on both iPhone and iPad simulators if applicable

## Resources

- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [VoiceFit Mobile App Docs](../../README.md)
- [Backend API Docs](../../../docs/api.md)

## Support

For issues with:
- **Maestro tests**: Check [Maestro Discord](https://discord.gg/mobile-dev)
- **VoiceFit app**: Open issue in project repository
- **Test infrastructure**: Contact the development team

---

**Last Updated**: January 2025  
**Maintainer**: VoiceFit Development Team  
**Test Suite Version**: 1.0.0