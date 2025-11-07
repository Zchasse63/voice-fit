# VoiceFit - Quick Start Implementation Guide

**Date:** November 5, 2025  
**Purpose:** Fast reference for implementing each feature

---

## 🚀 **Getting Started**

### **Prerequisites**
```bash
cd ~/Desktop/VoiceFit/apps/mobile
node -v  # Should be v20.19.5
npm -v   # Should be 10.8.2
```

### **Current State**
- ✅ Phase 1-3, 6 complete
- ⚠️ Phase 4-5 partially complete
- ❌ Missing: Run tracking, offline integration, auth UI

---

## 📅 **Week-by-Week Breakdown**

### **WEEK 1: Database & Auth (5 days)**

#### **Day 1: WatermelonDB Integration**

**Goal:** Connect workout.store to WatermelonDB

**Steps:**
1. Update `src/store/workout.store.ts`
2. Replace `completeWorkout()` to save to WatermelonDB
3. Mark records with `needsSync: true`
4. Test workout creation

**Test:**
```bash
# Log a workout
# Check WatermelonDB: should see record
# Check console: should see "needsSync: true"
```

---

#### **Day 2: SyncService**

**Goal:** Push/pull data between WatermelonDB and Supabase

**Steps:**
1. Implement `SyncService.pushToSupabase()`
2. Implement `SyncService.pullFromSupabase()`
3. Start background sync (30s interval)
4. Test sync

**Test:**
```bash
# Log workout offline
# Go online
# Wait 30 seconds
# Check Supabase: should see workout
```

---

#### **Day 3: Update Screens**

**Goal:** Load real data from WatermelonDB

**Steps:**
1. Update HomeScreen with `withObservables`
2. Update LogScreen with `withObservables`
3. Update PRsScreen with `withObservables`
4. Remove ALL mock data

**Test:**
```bash
# Open each screen
# Should see real data from database
# Should update in real-time
```

---

#### **Day 4: Authentication UI**

**Goal:** Build login and signup screens

**Steps:**
1. Create `src/screens/LoginScreen.tsx`
2. Create `src/screens/SignUpScreen.tsx`
3. Create auth navigator
4. Update `App.tsx` to show auth flow

**Test:**
```bash
# Sign up new user
# Log out
# Log in
# Session should persist
```

---

#### **Day 5: Cleanup**

**Goal:** Remove all mock data, add sync status

**Steps:**
1. Search codebase for "mock", "MOCK", "fake"
2. Delete all mock data
3. Create `SyncStatus` component
4. Add to HomeScreen, LogScreen, PRsScreen

**Test:**
```bash
# No mock data should remain
# Sync status should show in headers
```

---

### **WEEK 2: Run Tracking (5 days)**

#### **Day 1: Install Dependencies**

**Goal:** Set up react-native-maps and expo-location

**Steps:**
```bash
npx expo install react-native-maps expo-location
```

Update `app.json`:
```json
{
  "expo": {
    "plugins": [
      "react-native-maps",
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Track your runs"
      }]
    ],
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Track runs",
        "UIBackgroundModes": ["location"]
      }
    }
  }
}
```

Rebuild:
```bash
npx expo prebuild --clean
cd ios && pod install
```

---

#### **Day 2: GPS Service**

**Goal:** Create GPS tracking service

**Steps:**
1. Create `src/services/gps/GPSService.ios.ts`
2. Implement Haversine distance formula
3. Implement pace calculation
4. Test on device (not simulator)

**Test:**
```bash
# Request location permissions
# Start tracking
# Walk around
# Should see coordinates updating
```

---

#### **Day 3: Run Store**

**Goal:** State management for runs

**Steps:**
1. Create `src/store/run.store.ts`
2. Implement `startRun()`, `stopRun()`
3. Save to WatermelonDB on stop
4. Trigger sync

**Test:**
```bash
# Start run
# Stop run
# Check WatermelonDB: should see run record
```

---

#### **Day 4: RunScreen**

**Goal:** Build run tracking screen with map

**Steps:**
1. Create `src/screens/RunScreen.tsx`
2. Add MapView with user location
3. Add Polyline for route
4. Add stats overlay
5. Add start/stop button

**Test:**
```bash
# Open RunScreen
# Should see map
# Start run
# Should see route drawing
# Stats should update
```

---

#### **Day 5: Integration**

**Goal:** Connect StartScreen to RunScreen

**Steps:**
1. Update `src/screens/StartScreen.tsx`
2. Remove "coming soon" message
3. Navigate to RunScreen on run button
4. Test full flow

**Test:**
```bash
# Tap "Run" in StartScreen
# Should navigate to RunScreen
# Complete a run
# Should save to database
```

---

### **WEEK 3: Features (5 days)**

#### **Day 1-2: Calendar View**

**Goal:** Show workout history in calendar

**Steps:**
1. Create `src/components/calendar/WorkoutCalendar.tsx`
2. Create `src/components/calendar/CalendarDay.tsx`
3. Create `src/components/calendar/MonthView.tsx`
4. Update LogScreen

**Test:**
```bash
# Open LogScreen
# Should see calendar
# Dates with workouts should be highlighted
# Tap date: should filter workouts
```

---

#### **Day 3-4: Training Programs**

**Goal:** Program selection and templates

**Steps:**
1. Create `src/store/program.store.ts`
2. Create `src/components/programs/ProgramCard.tsx`
3. Create `src/components/programs/WorkoutTemplateCard.tsx`
4. Update StartScreen

**Test:**
```bash
# Open StartScreen
# Should see programs
# Select program
# Should see templates
```

---

#### **Day 5: Workout Details**

**Goal:** Detailed workout view

**Steps:**
1. Create `src/screens/WorkoutDetailScreen.tsx`
2. Add navigation from LogScreen
3. Show all sets, exercises, volume

**Test:**
```bash
# Tap workout in LogScreen
# Should navigate to detail view
# Should show all sets
```

---

### **WEEK 4: Polish (5 days)**

#### **Day 1-2: Exercise Library**

**Goal:** Searchable exercise database

**Steps:**
1. Create `src/screens/ExerciseLibraryScreen.tsx`
2. Add search functionality
3. Add category filters
4. Connect to Supabase

---

#### **Day 3: Settings**

**Goal:** User preferences

**Steps:**
1. Create `src/screens/SettingsScreen.tsx`
2. Theme selection
3. Unit preferences
4. Account settings

---

#### **Day 4-5: Testing**

**Goal:** End-to-end testing

**Checklist:**
- [ ] Offline workout logging
- [ ] Sync when online
- [ ] GPS tracking accuracy
- [ ] Auth flow
- [ ] All screens load data
- [ ] No mock data
- [ ] Performance (60fps)
- [ ] Battery (<15%/hour)

---

## 🔧 **Common Commands**

### **Development**
```bash
# Start dev server
cd apps/mobile
npx expo start

# Run on iOS
npx expo run:ios --device "iPhone 17 Pro Max"

# Type check
npx tsc --noEmit

# Install package
npm install <package> --legacy-peer-deps
```

### **Database**
```bash
# Reset WatermelonDB
# Delete app from simulator
# Reinstall

# Check Supabase
# Go to supabase.com
# View tables
```

### **Debugging**
```bash
# View logs
npx react-native log-ios

# Clear cache
npx expo start -c

# Rebuild
npx expo prebuild --clean
cd ios && pod install
```

---

## 🐛 **Troubleshooting**

### **"WatermelonDB not syncing"**
```typescript
// Check SyncService is running
SyncService.startBackgroundSync();

// Check needsSync flag
const unsynced = await database.collections
  .get('workout_logs')
  .query(Q.where('needs_sync', true))
  .fetch();
console.log('Unsynced:', unsynced.length);
```

### **"GPS not working"**
```bash
# Must test on physical device
# Simulator GPS is unreliable

# Check permissions
Settings > Privacy > Location Services > VoiceFit
```

### **"Map not showing"**
```bash
# Rebuild after adding react-native-maps
npx expo prebuild --clean
cd ios && pod install

# Check app.json has plugin
"plugins": ["react-native-maps"]
```

### **"Auth not working"**
```typescript
// Check Supabase URL and key
console.log(supabase.supabaseUrl);
console.log(supabase.supabaseKey);

// Check RLS policies in Supabase
```

---

## ✅ **Daily Checklist**

Before starting each day:
- [ ] Pull latest code
- [ ] Check TypeScript errors: `npx tsc --noEmit`
- [ ] Review plan for the day
- [ ] Set up test data if needed

After completing each day:
- [ ] Test the feature
- [ ] Commit code
- [ ] Update checklist
- [ ] Document any issues

---

## 📊 **Progress Tracking**

### **Week 1**
- [ ] Day 1: WatermelonDB integration
- [ ] Day 2: SyncService
- [ ] Day 3: Update screens
- [ ] Day 4: Auth UI
- [ ] Day 5: Cleanup

### **Week 2**
- [ ] Day 1: Install dependencies
- [ ] Day 2: GPS service
- [ ] Day 3: Run store
- [ ] Day 4: RunScreen
- [ ] Day 5: Integration

### **Week 3**
- [ ] Day 1-2: Calendar
- [ ] Day 3-4: Programs
- [ ] Day 5: Details

### **Week 4**
- [ ] Day 1-2: Exercise library
- [ ] Day 3: Settings
- [ ] Day 4-5: Testing

---

## 🎯 **Success Criteria**

App is complete when:
- [ ] All screens load from WatermelonDB
- [ ] Sync works offline → online
- [ ] GPS tracking works on device
- [ ] Users can sign up/login
- [ ] No mock data exists
- [ ] Calendar shows history
- [ ] Programs are selectable
- [ ] All tests pass
- [ ] Performance targets met

---

**Quick Start Guide Created:** November 5, 2025  
**See also:** `COMPLETE_IMPLEMENTATION_PLAN.md` for detailed specs

