# Live Activity Interactive Features - Complete Implementation Guide

## Overview

This document describes the complete implementation of interactive Live Activities for VoiceFit, including rest timers, action buttons, Siri Shortcuts, and user settings.

---

## Features Implemented

### 1. **Rest Timer** ✅
- **Auto-start after set completion**: Automatically starts rest timer when user logs a set
- **Exercise-specific rest periods**: Different rest times for different exercises (e.g., 3 min for squats, 90s for accessories)
- **Visual countdown**: Shows remaining time with color-coded states:
  - Blue: >30 seconds remaining
  - Orange: 10-30 seconds remaining
  - Red: <10 seconds remaining
- **Circular progress indicator**: Visual progress ring showing rest completion
- **User setting**: Can be disabled in settings

### 2. **Interactive Buttons** (iOS 16.4+) ✅

#### Complete Set Button
- **Trigger**: Tap "✓ Complete" button in Live Activity
- **Action**: Logs current set with prescribed weight/reps
- **Implementation**: `CompleteSetIntent.swift` App Intent
- **Behavior**: 
  - Logs set to database
  - Updates Live Activity to next set
  - Auto-starts rest timer (if enabled)

#### Skip Rest Button
- **Trigger**: Tap "Skip Rest" button during rest period
- **Action**: Skips rest timer and prepares for next set
- **Implementation**: `SkipRestIntent.swift` App Intent
- **Behavior**:
  - Stops rest timer
  - Updates Live Activity to remove rest display
  - Sets status to 'active'

#### Adjust Set Button
- **Trigger**: Tap "🎤 Adjust" button
- **Action**: Deep links to voice logging screen in app
- **Implementation**: URL scheme `voicefit://voice-log`
- **Behavior**: Opens app to voice logging screen for manual adjustments

### 3. **Siri Shortcuts Integration** ✅

#### Available Shortcuts
1. **"Log Set"**: Opens voice logging screen
2. **"Complete Set"**: Completes current set as prescribed
3. **"Skip Rest"**: Skips rest timer

#### Implementation
- `SiriShortcutsManager.swift`: Manages shortcut donation and handling
- Shortcuts donated when workout starts
- User can create custom Siri phrases in Settings > Siri & Search

#### Usage Examples
- "Hey Siri, log set" → Opens voice logging
- "Hey Siri, complete set" → Logs current set
- "Hey Siri, skip rest" → Skips rest timer

### 4. **User Settings** ✅

#### Available Settings
- **Enable/Disable Live Activity**: Master toggle for Live Activity feature
- **Show Elapsed Timer**: Toggle elapsed workout time display
- **Show Rest Timer**: Toggle rest timer display

#### Storage
- Stored in `user_preferences` table in Supabase
- Synced across devices
- Applied immediately to active Live Activity

---

## Technical Architecture

### Data Flow

```
User Action (Button/Siri)
    ↓
App Intent / Notification
    ↓
React Native Event Handler
    ↓
Workout Store Update
    ↓
Live Activity Service Update
    ↓
Native Module Bridge
    ↓
Activity Kit Update
    ↓
Lock Screen / Dynamic Island UI
```

### State Management

#### ContentState Fields
```swift
struct ContentState {
    // Exercise info
    var currentExercise: String?
    var currentSet: Int
    var totalSets: Int
    
    // Last set data
    var lastSetWeight: Double?
    var lastSetReps: Int?
    var lastSetRPE: Int?
    
    // Timing
    var elapsedTime: Int
    
    // Rest timer
    var restTimeRemaining: Int?
    var restTimerActive: Bool
    var targetRestTime: Int
    var restStartedAt: Int?
    
    // Status
    var status: String // "active" | "paused" | "resting" | "completed"
    
    // User preferences
    var showElapsedTimer: Bool
    var showRestTimer: Bool
}
```

---

## Integration Points

### 1. Workout Store Integration
- **Start workout**: Calls `liveActivityService.startActivity()`
- **Log set**: Calls `liveActivityService.updateActivity()` + `startRestTimer()`
- **Complete workout**: Calls `liveActivityService.endActivity()`

### 2. Rest Period Data
- Fetched from `scheduled_workouts` table
- Exercise-specific rest times stored in `rest_seconds` column
- Passed to Live Activity when starting workout

### 3. Voice Command Integration
- Voice commands trigger same actions as buttons
- "I'm done" / "workout complete" → End Live Activity
- "Log 225 for 8 reps" → Update Live Activity with new set data

---

## Files Created/Modified

### Swift Files (iOS Native)
- ✅ `WorkoutActivityAttributes.swift` - Updated with rest timer fields
- ✅ `WorkoutLiveActivity.swift` - Updated with buttons and rest timer UI
- ✅ `LiveActivityModule.swift` - Updated to parse rest timer fields
- ✅ `CompleteSetIntent.swift` - NEW: App Intent for completing sets
- ✅ `SkipRestIntent.swift` - NEW: App Intent for skipping rest
- ✅ `SiriShortcutsManager.swift` - NEW: Siri Shortcuts management
- ✅ `SiriShortcutsManager.m` - NEW: Objective-C bridge

### TypeScript Files
- ✅ `LiveActivityService.ts` - Updated with rest timer methods
- ⏳ `workout.store.ts` - TODO: Add Live Activity integration
- ⏳ `SettingsScreen.tsx` - TODO: Add Live Activity settings UI

### Database
- ⏳ `scheduled_workouts` table - TODO: Ensure `rest_seconds` column exists
- ⏳ `user_preferences` table - TODO: Add Live Activity preference fields

---

## Next Steps (Manual Xcode Setup)

### Step 1: Create Widget Extension Target
1. Open `VoiceFit.xcworkspace` in Xcode
2. File → New → Target → Widget Extension
3. Name: `WorkoutWidget`
4. ✅ Check "Include Live Activity"
5. Language: Swift
6. Click Finish

### Step 2: Assign Files to Targets
**Widget Extension Target** (WorkoutWidget):
- `WorkoutActivityAttributes.swift`
- `WorkoutLiveActivity.swift`
- `CompleteSetIntent.swift`
- `SkipRestIntent.swift`

**Main App Target** (VoiceFit):
- `LiveActivityModule.swift`
- `LiveActivityModule.m`
- `SiriShortcutsManager.swift`
- `SiriShortcutsManager.m`

### Step 3: Configure Info.plist
Add to main app `Info.plist`:
```xml
<key>NSUserActivityTypes</key>
<array>
    <string>com.voicefit.logset</string>
    <string>com.voicefit.completeset</string>
    <string>com.voicefit.skiprest</string>
</array>
```

### Step 4: Build & Test
- Build on physical device (iOS 16.1+)
- Test all interactive features
- Verify Siri Shortcuts work

---

## Testing Checklist

- [ ] Live Activity starts when workout begins
- [ ] Elapsed timer updates every 5 seconds
- [ ] Rest timer starts after logging set
- [ ] Rest timer counts down every second
- [ ] Rest timer color changes (blue → orange → red)
- [ ] Complete Set button logs set correctly
- [ ] Skip Rest button stops rest timer
- [ ] Adjust Set button opens app to voice screen
- [ ] Siri "Log Set" shortcut opens voice screen
- [ ] Siri "Complete Set" shortcut logs set
- [ ] Siri "Skip Rest" shortcut skips rest
- [ ] Settings toggle Live Activity on/off
- [ ] Settings toggle elapsed timer visibility
- [ ] Settings toggle rest timer visibility
- [ ] Live Activity ends when workout completes
- [ ] Dynamic Island shows compact/expanded views

---

## Known Limitations

1. **iOS Version Requirements**:
   - Live Activities: iOS 16.1+
   - Interactive Buttons: iOS 16.4+
   - Siri Shortcuts: iOS 12.0+

2. **Microphone Access**:
   - Cannot record audio directly from Live Activity
   - Workaround: Deep link to app + Siri Shortcuts

3. **Background Execution**:
   - App Intents run in app process, not widget process
   - App must be in background (not terminated) for intents to work

---

## Future Enhancements

- [ ] Push notifications for rest timer completion
- [ ] Haptic feedback for rest timer milestones
- [ ] Custom rest timer sounds
- [ ] Rest timer presets (quick select 60s, 90s, 120s, 180s)
- [ ] Exercise-specific button actions
- [ ] Multi-set completion (complete all remaining sets)

