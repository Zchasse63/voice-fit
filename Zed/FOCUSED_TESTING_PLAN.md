# VoiceFit - Focused Testing Plan (Recent Work)

**Date**: January 2025  
**Focus**: Sessions 5-7 + Navigation & Backend Integration  
**Estimated Time**: 2-3 hours

---

## 🎯 What We're Testing

This plan focuses ONLY on the work completed in the last session:

1. **Session 5**: Home Dashboard (MetricCard, TimelineItem, StatsOverview, HomeScreen)
2. **Session 6**: Run Screen (Redesigned with Runna-inspired layout)
3. **Session 7**: Integration & Testing Prep
4. **Navigation**: 3-tab navigation + Profile modal via avatar
5. **Backend**: Railway API integration + Chat functionality

**Not Testing** (already built in Sessions 1-4):
- ❌ Auth screens (SignIn, SignUp)
- ❌ Profile screen itself (already tested)
- ❌ Chat components (ChatBubble, ChatInput, ChatHeader)
- ❌ Core UI components (Button, Input, Card, PillBadge)

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
```bash
cd VoiceFit/apps/mobile
npm install
cp .env.example .env
# Edit .env with Supabase credentials
npm start
# Press 'i' for iOS or 'a' for Android
```

### First Things to Check
1. **App launches** without crash
2. **Sign in** with existing account (or create new one)
3. **3 tabs visible**: Home, Run, Chat (NOT 4!)
4. **Avatar button** visible in top-right of HomeScreen
5. **Dark mode toggle** works (Profile → Appearance)

---

## 📱 Session 5: Home Dashboard Testing

### HomeScreen - Visual Check
**Location**: Home tab (first tab)

- [ ] **Header**
  - [ ] Greeting shows: "Good morning/afternoon/evening, [Name]"
  - [ ] Date displays correctly (e.g., "Thursday, January 16")
  - [ ] Avatar button in top-right corner
  - [ ] Avatar shows user's first initial

- [ ] **Weekly Stats Cards** (scrollable horizontal)
  - [ ] "Workouts" stat shows (number)
  - [ ] "Total Volume" stat shows (lbs)
  - [ ] "Total Sets" stat shows (number)
  - [ ] "Training Time" stat shows (minutes)
  - [ ] Cards scroll horizontally
  - [ ] Stats update with real data from WatermelonDB

- [ ] **Start Workout Button**
  - [ ] Large blue button visible
  - [ ] Text reads "Start Workout"
  - [ ] Button responds to tap (loading/action)

- [ ] **Metric Cards Grid** (2 columns)
  - [ ] "Weekly Goal" card (left)
    - Shows goal progress (e.g., "4/5")
    - Green target icon
    - Trend indicator ("+1")
  - [ ] "Streak" card (right)
    - Shows streak number (e.g., "12")
    - Orange lightning icon
    - Days subtitle

- [ ] **Today's Program Card**
  - [ ] Title: "Today's Program"
  - [ ] Workout name (e.g., "Push Day")
  - [ ] Muscle groups listed
  - [ ] Time estimate shown
  - [ ] Exercise count shown

- [ ] **Recent Activity Timeline**
  - [ ] Title: "Recent Activity"
  - [ ] Up to 5 recent workouts listed
  - [ ] Each item shows:
    - Workout name
    - Duration
    - Date (Today, Yesterday, X days ago)
    - Dumbbell icon
    - Vertical line connecting items (except last)
  - [ ] Tappable (even if no action yet)

- [ ] **Personal Records Card**
  - [ ] Title: "Personal Records"
  - [ ] "View All" link in top-right
  - [ ] Recent PR shown:
    - Weight/reps
    - Exercise name
    - Date
    - Trend indicator

### HomeScreen - Dark Mode
- [ ] Toggle dark mode (tap avatar → Profile → Appearance toggle)
- [ ] Background changes to dark gray/black
- [ ] Text remains readable (white/light gray)
- [ ] Cards have proper contrast
- [ ] Accent colors visible (blue, green, orange)
- [ ] Stats cards have distinct backgrounds
- [ ] Toggle back to light mode works

### HomeScreen - Data Integration
- [ ] **If you have workout data**:
  - [ ] Weekly stats show real numbers (not 0)
  - [ ] Recent activity shows actual workouts
  - [ ] Dates are accurate
  - [ ] Duration calculations correct

- [ ] **If no workout data**:
  - [ ] Stats show 0 (not error)
  - [ ] Recent activity empty or shows empty state
  - [ ] No crashes

### MetricCard Component
Test in ComponentTestScreen (if needed) or observe in HomeScreen:
- [ ] Icon displays correctly
- [ ] Title text readable
- [ ] Value in large font
- [ ] Subtitle/trend in small font
- [ ] Trend arrows (↑ ↓) display
- [ ] Trend colors correct (green up, coral down)
- [ ] Compact variant is smaller
- [ ] Press state works (if onPress provided)

### TimelineItem Component
Test in Recent Activity section:
- [ ] Icon circle displays
- [ ] Vertical line connects items (except last)
- [ ] Title, subtitle, time all visible
- [ ] Text hierarchy clear (title bold, subtitle/time lighter)
- [ ] Press state works
- [ ] Last item has no line below it

### StatsOverview Component
Test in Weekly Stats section:
- [ ] Row variant scrolls horizontally
- [ ] All 4 stat cards visible
- [ ] Cards have proper spacing
- [ ] Units display correctly (lbs, min)
- [ ] Colors match design (blue, green, purple, coral)

---

## 🏃 Session 6: Run Screen Testing

### RunScreen - Initial State
**Location**: Run tab (second tab)

- [ ] **Permission Prompt** (first time)
  - [ ] Location permission dialog appears
  - [ ] "Grant Permission" button works
  - [ ] After grant, map appears

- [ ] **Map View** (if permission granted)
  - [ ] Full-screen map (edge-to-edge)
  - [ ] User's location shows (blue dot)
  - [ ] Map is interactive (pan, zoom)
  - [ ] No unnecessary UI chrome

### RunScreen - Before Starting Run
- [ ] **Large Start Button**
  - [ ] Centered at bottom
  - [ ] Green color
  - [ ] 80x80 size (large)
  - [ ] Play icon (▶) visible
  - [ ] Text: "Tap to start tracking your run"

- [ ] **Bottom Panel**
  - [ ] Semi-transparent background
  - [ ] Rounded top corners
  - [ ] Sits above tab bar

### RunScreen - During Run
**Action**: Tap Start button

- [ ] **Stats Overlay** (top of screen)
  - [ ] Semi-transparent card
  - [ ] Floating above map
  - [ ] Distance in large text (primary stat)
  - [ ] "MILES" label below distance
  - [ ] Divider line
  - [ ] Three secondary stats in row:
    - Time (HH:MM or MM:SS)
    - Pace (min/mi)
    - Calories
  - [ ] Labels in small caps (TIME, PACE /MI, CALORIES)

- [ ] **Route Polyline**
  - [ ] Blue line draws on map as you move
  - [ ] Line is smooth (not jagged)
  - [ ] Line color matches theme

- [ ] **Control Buttons** (bottom panel)
  - [ ] Two buttons visible:
    - **Pause** (orange, 70x70, left)
    - **Stop** (coral/red, 70x70, right)
  - [ ] Buttons have proper spacing
  - [ ] Icons visible (⏸ for pause, ⏹ for stop)

- [ ] **Stats Update**
  - [ ] Distance increases as you move
  - [ ] Time ticks every second
  - [ ] Pace calculates correctly
  - [ ] Calories estimate reasonable

### RunScreen - Pause/Resume
**Action**: Tap Pause button

- [ ] Button changes to green Resume button
- [ ] Time stops incrementing
- [ ] Stats freeze
- [ ] Route polyline stops drawing

**Action**: Tap Resume button
- [ ] Button changes back to orange Pause
- [ ] Time resumes
- [ ] Stats continue updating
- [ ] Route continues drawing

### RunScreen - Stop Run
**Action**: Tap Stop button

- [ ] **Confirmation dialog** appears:
  - [ ] Title: "Stop Run"
  - [ ] Message: "Are you sure..."
  - [ ] Two buttons: "Cancel" and "Stop"
  - [ ] Red/destructive style on Stop

**Action**: Tap Stop (confirm)
- [ ] "Run Saved" alert appears
- [ ] "OK" button dismisses
- [ ] Screen resets to initial state
- [ ] Start button appears again

### RunScreen - Elevation Stats (if available)
If device supports elevation:
- [ ] Elevation gain shows (green, +XXXm)
- [ ] Elevation loss shows (coral, -XXXm)
- [ ] Stats appear below main stats

### RunScreen - Dark Mode
- [ ] Toggle dark mode
- [ ] Stats overlay background darkens
- [ ] Text remains readable
- [ ] Control panel background darkens
- [ ] Map style adjusts (if applicable)
- [ ] Polyline still visible

### RunScreen - Error Handling
- [ ] **No GPS signal**
  - [ ] Error message shows
  - [ ] Doesn't crash
  - [ ] Retries when signal returns

- [ ] **Permission denied**
  - [ ] Shows permission required screen
  - [ ] MapPin icon visible
  - [ ] "Grant Permission" button works

---

## 🧭 Navigation Testing

### 3-Tab Navigation
- [ ] **Bottom Tabs Visible**
  - [ ] Home icon (house)
  - [ ] Run icon (activity/pulse)
  - [ ] Chat icon (message bubble)
  - [ ] NO Profile icon (correct!)

- [ ] **Tab Switching**
  - [ ] Tap Home → goes to HomeScreen
  - [ ] Tap Run → goes to RunScreen
  - [ ] Tap Chat → goes to ChatScreen
  - [ ] Current tab highlighted (blue)
  - [ ] Inactive tabs grayed out
  - [ ] Smooth transitions

- [ ] **Tab Bar Styling**
  - [ ] Proper height (~88pt)
  - [ ] Background color matches theme
  - [ ] Top border visible
  - [ ] Safe area respected (notch/home indicator)

### Profile Modal Access
**Location**: HomeScreen

- [ ] **Avatar Button**
  - [ ] Visible in top-right of HomeScreen header
  - [ ] Circular (40x40)
  - [ ] Blue background
  - [ ] Shows user's first initial (white text)
  - [ ] Press state (opacity change)

**Action**: Tap avatar button
- [ ] **Profile Opens**
  - [ ] Slides up from bottom (modal animation)
  - [ ] Full screen
  - [ ] X button in top-right
  - [ ] User info visible
  - [ ] Settings sections visible

**Action**: Tap X button
- [ ] **Profile Closes**
  - [ ] Slides down (reverse animation)
  - [ ] Returns to HomeScreen
  - [ ] HomeScreen state preserved

**Action**: Swipe down on Profile (if supported)
- [ ] Profile dismisses
- [ ] Returns to HomeScreen

### Navigation State Persistence
- [ ] Switch to Run tab
- [ ] Close app (background)
- [ ] Reopen app
- [ ] Still on Run tab (or Home, depending on config)

---

## 🔗 Backend Integration Testing

### API Client Setup
**Prerequisites**:
- Railway backend deployed and running
- `EXPO_PUBLIC_API_URL` set in `.env`

### Health Check
**Test**: Backend is reachable

```bash
# In terminal
curl https://voicefit.railway.app/health

# Expected response:
# {"status":"ok","message":"VoiceFit API is running"}
```

- [ ] Health endpoint responds
- [ ] Status is "ok"

### Chat Integration
**Location**: Chat tab (third tab)

- [ ] **Chat Screen Opens**
  - [ ] Single header "Chat"
  - [ ] iOS Messages-style bubbles
  - [ ] Input bar at bottom
  - [ ] Initial greeting from AI (if configured)

**Action**: Type message and send

- [ ] **Message Flow**:
  - [ ] User message appears immediately (blue, right-aligned)
  - [ ] Input clears
  - [ ] Loading indicator appears (if implemented)
  - [ ] Wait ~2-5 seconds
  - [ ] AI response appears (gray, left-aligned)
  - [ ] Scroll to bottom

- [ ] **Response Validation**:
  - [ ] Response is relevant to message
  - [ ] Response text readable
  - [ ] Timestamp shows
  - [ ] No console errors

### Chat - Error Handling
**Test**: Network errors

**Method 1**: Turn off WiFi/data
- [ ] Type message and send
- [ ] Alert appears: "Connection Error"
- [ ] Error message added to chat
- [ ] App doesn't crash

**Method 2**: Railway backend down
- [ ] Same as above
- [ ] Proper error handling

**Method 3**: Turn network back on
- [ ] Send another message
- [ ] Should work normally
- [ ] Recovers gracefully

### Authentication Token
**Test**: JWT token automatically included

Check in backend logs (if accessible):
- [ ] Requests include `Authorization: Bearer <token>`
- [ ] Token is valid Supabase JWT
- [ ] Backend accepts token

---

## 🎨 Theme & Styling Testing

### Dark Mode Consistency
**Action**: Toggle dark mode in Profile

Test all screens:
- [ ] **HomeScreen**
  - [ ] Background dark
  - [ ] Text readable
  - [ ] Cards distinct
  - [ ] Accent colors visible

- [ ] **RunScreen**
  - [ ] Stats overlay dark
  - [ ] Control panel dark
  - [ ] Text readable
  - [ ] Map still visible

- [ ] **ChatScreen**
  - [ ] Background dark
  - [ ] Bubbles have contrast
  - [ ] Text readable
  - [ ] Input bar visible

- [ ] **Profile**
  - [ ] Background dark
  - [ ] Settings sections distinct
  - [ ] Toggle switches styled
  - [ ] Sign out button visible

### Theme Persistence
- [ ] Toggle dark mode ON
- [ ] Close app completely
- [ ] Reopen app
- [ ] Still in dark mode
- [ ] Toggle back to light mode
- [ ] Close app
- [ ] Reopen
- [ ] Back to light mode

### Color Palette (MacroFactor)
- [ ] Light mode: White/gray backgrounds
- [ ] Dark mode: Black/dark gray backgrounds
- [ ] Accent blue: #007AFF (iOS blue)
- [ ] Accent green: #34C759
- [ ] Accent orange: #FF9500
- [ ] Accent coral: #FF6B6B
- [ ] Text contrast proper in both modes

---

## 📊 Data & Performance Testing

### WatermelonDB Integration
**Test**: HomeScreen loads real data

If you have workouts in database:
- [ ] Weekly stats accurate
- [ ] Recent workouts list correct
- [ ] Dates format correctly
- [ ] No duplicates
- [ ] Data updates on navigation

If no workouts:
- [ ] Shows 0 gracefully
- [ ] No crashes
- [ ] Empty states (if implemented)

### Performance
- [ ] **HomeScreen Loads**
  - [ ] Stats load within 1 second
  - [ ] No janky scrolling
  - [ ] Smooth animations

- [ ] **RunScreen GPS**
  - [ ] GPS initializes quickly (<3 seconds)
  - [ ] Map renders smoothly
  - [ ] No lag during tracking
  - [ ] Polyline draws smoothly

- [ ] **Chat Messages**
  - [ ] Scroll smooth with 10+ messages
  - [ ] No lag when typing
  - [ ] Send/receive smooth

### Memory & Crashes
- [ ] Use app for 5-10 minutes
- [ ] Navigate between all tabs multiple times
- [ ] Open/close Profile several times
- [ ] Start/stop run (if testing GPS)
- [ ] Send multiple chat messages
- [ ] No crashes
- [ ] No memory warnings (check Xcode/Android Studio)

---

## ✅ Quick Checklist (30-Minute Test)

### Must Test
- [ ] 3 tabs visible (Home, Run, Chat) - NOT 4
- [ ] Avatar button in HomeScreen top-right
- [ ] Profile opens/closes as modal
- [ ] HomeScreen shows weekly stats
- [ ] Recent activity timeline works
- [ ] RunScreen shows map
- [ ] Start button appears and works
- [ ] ChatScreen sends message to backend
- [ ] AI response received (or error shown)
- [ ] Dark mode works across all screens
- [ ] No crashes during navigation

### Nice to Test
- [ ] All stats accurate
- [ ] GPS tracking works
- [ ] Elevation data shows
- [ ] Theme persists across restarts
- [ ] Error handling for network issues
- [ ] All animations smooth

---

## 🐛 Known Issues to Check

### Potential Issues
- [ ] iOS Podfile.lock conflicts (if any)
- [ ] Metro cache issues
- [ ] Environment variables not loaded
- [ ] Backend URL incorrect
- [ ] Supabase session expired
- [ ] GPS permissions on simulator (won't work)

### If Something Doesn't Work
1. **Check .env file** - Supabase credentials correct?
2. **Restart Metro** - `npm start --reset-cache`
3. **Reinstall** - `rm -rf node_modules && npm install`
4. **Check backend** - `curl https://voicefit.railway.app/health`
5. **Check logs** - Metro bundler terminal output

---

## 📝 Testing Notes Template

Use this to track issues:

```
## Test Session: [Date]
**Device**: iOS Simulator / iPhone 15 / Android Emulator
**OS Version**: iOS 17 / Android 14
**Duration**: X minutes

### What Worked ✅
- 

### Issues Found 🐛
1. [Issue description]
   - Steps to reproduce:
   - Expected:
   - Actual:
   - Priority: High/Medium/Low

2. [Issue description]
   - ...

### Screenshots
- [Attach screenshots]

### Next Steps
- 
```

---

## 🎯 Success Criteria

You can consider testing successful if:

### Critical (Must Pass)
- ✅ App launches without crash
- ✅ 3-tab navigation works (Home, Run, Chat)
- ✅ Avatar button opens Profile modal
- ✅ HomeScreen displays with all sections
- ✅ RunScreen shows map and start button
- ✅ ChatScreen sends/receives messages
- ✅ Dark mode toggles correctly
- ✅ No crashes during 10-minute test

### Important (Should Pass)
- ✅ Weekly stats load real data
- ✅ Recent activity shows workouts
- ✅ GPS tracking works (on device)
- ✅ Backend integration works
- ✅ Error handling for network issues
- ✅ Theme persists across restarts

### Nice to Have (Can Fix Later)
- ⚪ All animations perfect
- ⚪ All edge cases handled
- ⚪ Empty states implemented
- ⚪ Loading states everywhere

---

## 📞 Quick Help

### Issue: "Cannot find module"
```bash
cd VoiceFit/apps/mobile
rm -rf node_modules
npm install
```

### Issue: Metro bundler error
```bash
npm start --reset-cache
```

### Issue: "Network request failed"
```bash
# Check backend
curl https://voicefit.railway.app/health

# Check .env
cat .env | grep API_URL
```

### Issue: Dark mode not working
```bash
# Clear AsyncStorage
# In app: Profile → Sign out and sign back in
```

---

**Estimated Testing Time**: 2-3 hours for thorough testing, 30 minutes for quick validation

**Priority**: Focus on Critical items first, then Important, then Nice to Have

**Next**: After testing, document issues and create fix plan

Good luck! 🚀