# CROSS-SCREEN DATA FLOW AUDIT - VoiceFit Mobile App

**Date:** 2025-11-21  
**Status:** 🔴 **CRITICAL ISSUES FOUND** - Multiple data flow failures across screens  
**Scope:** Complete analysis of data communication between all mobile app screens

---

## EXECUTIVE SUMMARY

### Critical Findings
- ✅ **HomeScreen**: Already diagnosed - UUID/string mismatch, missing columns, silent errors
- 🔴 **ChatScreen**: Messages NOT persisted to WatermelonDB - lost on app restart
- 🔴 **RunScreen**: Runs saved locally but SYNC TO SUPABASE BROKEN
- 🔴 **Cross-Screen**: No data refresh mechanisms when navigating between screens
- 🔴 **SyncService**: Incomplete - only syncs workout_logs/sets, NOT runs/messages/readiness

### Impact Assessment
- **User Experience**: Data appears to work but is siloed per screen, not shared
- **Data Loss Risk**: HIGH - Chat messages and runs may not sync to cloud
- **Offline-First**: BROKEN - Sync service doesn't cover all data types
- **Navigation**: Stale data shown when switching screens

---

## PHASE 2: COMPREHENSIVE CROSS-SCREEN ANALYSIS

## 1. HOMESCREEN ↔ CHATSCREEN

### Current Implementation

**HomeScreen Data Sources:**
- SupabaseAnalyticsService (direct Supabase queries)
- ChartDataService (aggregates from Supabase)
- AnalyticsAPIClient (backend API for fatigue analytics)
- useWorkoutStore (Zustand - active workout state)

**ChatScreen Data Sources:**
- Local state only (`useState` for messages array)
- Backend API calls for AI responses
- QuickLogBar component for workout logging
- NO WatermelonDB persistence
- NO Supabase sync

### Issues Found

**ISSUE 1: Chat Messages Not Persisted (CRITICAL)**
- **Root Cause**: ChatScreen stores messages in local `useState` only
- **Evidence**: 
  ```typescript
  // apps/mobile/src/screens/ChatScreen.tsx:107
  const [messages, setMessages] = useState<Message[]>([...]);
  ```
- **Impact**: All chat history lost when app closes or screen unmounts
- **Database**: WatermelonDB has `messages` table but ChatScreen doesn't use it
- **Supabase**: No `messages` table in Supabase migrations - chat data can't sync to cloud

**ISSUE 2: Workout Logs from Chat Don't Update HomeScreen**
- **Root Cause**: When user logs workout via ChatScreen QuickLogBar, HomeScreen doesn't refresh
- **Evidence**: No navigation listeners or focus effects to trigger data reload
- **Impact**: User logs workout in chat, switches to Home, sees stale data
- **Missing**: `useFocusEffect` hook to reload analytics when HomeScreen becomes active

**ISSUE 3: No Session Persistence**
- **Root Cause**: ChatScreen tracks `sessionId` in local state only
- **Evidence**: Session lost on screen unmount or app restart
- **Impact**: User loses conversation context mid-session
- **Backend Issue**: Backend sessions stored in-memory (see PRODUCTION_READINESS_STATUS.md)

### Recommended Fixes

1. **Persist Chat Messages to WatermelonDB**
   - Save each message to `messages` table when sent/received
   - Load message history from WatermelonDB on screen mount
   - Mark messages as `synced: false` for future cloud sync

2. **Create Supabase `messages` Table**
   - Add migration for `messages` table matching WatermelonDB schema
   - Update SyncService to sync messages bidirectionally

3. **Add HomeScreen Data Refresh**
   - Use `useFocusEffect` to reload analytics when screen becomes active
   - Listen to workout store changes to trigger refresh

4. **Implement Session Persistence**
   - Store sessionId in AsyncStorage
   - Restore session on app restart
   - Backend: Move sessions to Redis (already documented as MUST-HAVE)

---

## 2. HOMESCREEN ↔ RUNSCREEN

### Current Implementation

**HomeScreen Run Data:**
- No run-specific data displayed currently
- Could show recent runs, total distance, etc. in future

**RunScreen Data Flow:**
- GPS tracking via `gpsService`
- Run state in `useRunStore` (Zustand)
- Saves completed runs to WatermelonDB `runs` table
- Sets `synced: false` flag for cloud sync

### Issues Found

**ISSUE 4: Runs NOT Syncing to Supabase (CRITICAL)**
- **Root Cause**: SyncService only syncs `workout_logs` and `sets`, NOT `runs`
- **Evidence**:
  ```typescript
  // apps/mobile/src/services/sync/SyncService.ts:225
  async fullSync(userId: string): Promise<void> {
    await this.syncWorkoutsToSupabase();
    await this.syncSetsToSupabase();
    // ❌ NO syncRunsToSupabase() method!
  }
  ```
- **Impact**: Runs saved locally but NEVER uploaded to cloud
- **Data Loss**: If user uninstalls app or switches devices, all run history lost
- **Verification**: Check Supabase `runs` table - likely empty despite local runs existing

**ISSUE 5: Run Data Schema Mismatch**
- **WatermelonDB Schema**: Has `workout_type` and `workout_name` fields
- **Supabase Schema**: Unknown - need to verify `runs` table exists and matches
- **Risk**: Sync will fail if schemas don't align

**ISSUE 6: No Run History on HomeScreen**
- **Current**: HomeScreen doesn't display any run data
- **Missing**: Recent runs widget, total distance this week, etc.
- **Impact**: User can't see run progress on main dashboard

### Recommended Fixes

1. **Add syncRunsToSupabase() Method**
   - Create method in SyncService to upload unsynced runs
   - Call in fullSync() after workout/set sync
   - Handle route JSON serialization properly

2. **Verify/Create Supabase runs Table**
   - Check if `runs` table exists in Supabase
   - If not, create migration matching WatermelonDB schema
   - Ensure all fields align (especially `route` JSON field)

3. **Add Run Analytics to HomeScreen**
   - Create RunAnalyticsService similar to SupabaseAnalyticsService
   - Display recent runs, weekly distance, pace trends
   - Add "Runs This Week" metric card

---

## 4. HOMESCREEN ↔ PROFILESCREEN

### Current Implementation

**ProfileScreen:**
- Displays user info from `useAuthStore`
- Settings stored in AsyncStorage (theme, notifications)
- Navigation to sub-screens (Personal Info, Wearables, Notifications, Support)

**HomeScreen:**
- Shows user avatar/name from `useAuthStore`
- No profile-specific data displayed

### Issues Found

**ISSUE 9: User Profile Data Not in Database**
- **Root Cause**: User profile (name, avatar, tier) only in Zustand store
- **Evidence**: No `user_profiles` table queries in mobile app
- **Impact**: Profile data lost if auth store clears
- **Supabase**: Has `user_profiles` table but mobile doesn't sync to it

**ISSUE 10: Settings Not Synced Across Devices**
- **Root Cause**: Settings stored in AsyncStorage only (local device)
- **Impact**: User switches devices, loses all preferences
- **Missing**: User preferences table sync

### Recommended Fixes

1. **Sync User Profile to Supabase**
   - Query `user_profiles` table on login
   - Update profile when user changes name/avatar
   - Store in WatermelonDB for offline access

2. **Create User Preferences Sync**
   - Add `user_preferences` table to WatermelonDB
   - Sync preferences to Supabase
   - Load from cloud on new device login

---

## 5. RUNSCREEN ↔ RUNSETTINGSSCREEN

### Current Implementation

**RunSettingsScreen:**
- Reads settings from `useRunStore`
- Saves settings to AsyncStorage
- Updates Zustand store via `updateSettings()`

**RunScreen:**
- Reads settings from `useRunStore`
- Uses settings for auto-pause, countdown, feedback distance

### Issues Found

**ISSUE 11: Run Settings Not Synced to Cloud**
- **Root Cause**: Settings only in AsyncStorage + Zustand
- **Impact**: User switches devices, loses run preferences
- **Missing**: Cloud sync for run settings

**ISSUE 12: No Settings Validation**
- **Root Cause**: Settings can be set to invalid values
- **Impact**: App may crash or behave unexpectedly
- **Missing**: Schema validation for settings

### Recommended Fixes

1. **Add Run Settings to User Preferences**
   - Store run settings in `user_preferences` table
   - Sync to Supabase
   - Validate settings before saving

2. **Add Settings Schema Validation**
   - Define TypeScript schema for run settings
   - Validate on update
   - Provide sensible defaults

---

## 6. CHATSCREEN ↔ PROFILESCREEN

### Current Implementation

**No Direct Interaction:**
- Chat doesn't access profile settings
- Profile doesn't show chat history

### Issues Found

**ISSUE 13: Chat Can't Personalize Based on Profile**
- **Missing**: Chat doesn't know user's tier (free vs premium)
- **Impact**: Can't offer tier-appropriate features
- **Evidence**: ChatScreen checks `isFreeTier` from route params, not from user profile

**ISSUE 14: No Chat Preferences**
- **Missing**: User can't set chat preferences (voice, response style)
- **Impact**: One-size-fits-all chat experience

### Recommended Fixes

1. **Access User Tier in Chat**
   - Read tier from `useAuthStore`
   - Adjust features based on tier
   - Show upgrade prompts for premium features

2. **Add Chat Preferences**
   - Add chat preferences to user settings
   - Allow customization of response style
   - Save to cloud for cross-device sync

---

## 7. SYNC SERVICE ANALYSIS

### Current Implementation

**SyncService Coverage:**
- ✅ Syncs `workout_logs` (WatermelonDB → Supabase)
- ✅ Syncs `sets` (WatermelonDB → Supabase)
- ❌ Does NOT sync `runs`
- ❌ Does NOT sync `messages`
- ❌ Does NOT sync `readiness_scores`
- ❌ Does NOT sync `pr_history`
- ❌ Does NOT sync `programs`
- ❌ Does NOT sync `workout_templates`
- ❌ Does NOT sync `scheduled_workouts`

**Background Sync:**
- Runs every 30 seconds when active
- Stops when app backgrounds
- No retry logic for failed syncs

### Issues Found

**ISSUE 15: Incomplete Sync Coverage (CRITICAL)**
- **Root Cause**: SyncService only handles 2 of 12 data types
- **Impact**: Most user data never reaches cloud
- **Data Loss Risk**: EXTREME - 83% of data types not backed up
- **Evidence**: Only `syncWorkoutsToSupabase()` and `syncSetsToSupabase()` methods exist

**ISSUE 16: No Bidirectional Sync for Most Tables**
- **Root Cause**: Only `downloadWorkoutsFromSupabase()` exists
- **Impact**: User can't access data from other devices
- **Missing**: Download methods for runs, messages, readiness, etc.

**ISSUE 17: No Conflict Resolution**
- **Root Cause**: Sync assumes no conflicts (last-write-wins)
- **Impact**: Data can be overwritten unexpectedly
- **Missing**: Conflict detection and resolution strategy

**ISSUE 18: No Sync Status Visibility**
- **Root Cause**: User can't see what's synced vs pending
- **Impact**: User doesn't know if data is safe
- **Evidence**: SyncStatus component exists but not used in main screens

### Recommended Fixes

1. **Expand Sync Coverage to All Tables**
   - Add sync methods for runs, messages, readiness_scores
   - Add sync methods for programs, templates, scheduled_workouts
   - Add sync methods for pr_history, injury_logs, badges, streaks

2. **Implement Bidirectional Sync**
   - Add download methods for all synced tables
   - Merge remote changes with local changes
   - Handle deletions properly

3. **Add Conflict Resolution**
   - Detect conflicts (same record modified locally and remotely)
   - Use timestamp-based resolution or user prompts
   - Log conflicts for debugging

4. **Show Sync Status to User**
   - Add SyncStatus component to HomeScreen
   - Show pending sync count
   - Allow manual sync trigger

---

## 8. NAVIGATION & DATA REFRESH

### Current Implementation

**Navigation Structure:**
- Bottom tabs: Home, Chat, Run
- Stack screens: Profile, Settings, Detail screens
- No navigation listeners for data refresh

**Screen Lifecycle:**
- Screens load data in `useEffect` on mount
- No refresh when returning to screen
- No refresh when data changes in other screens

### Issues Found

**ISSUE 19: Stale Data on Screen Return (CRITICAL)**
- **Root Cause**: Screens don't reload data when becoming active
- **Impact**: User logs workout in Chat, switches to Home, sees old data
- **Missing**: `useFocusEffect` hooks to trigger refresh
- **Evidence**: No focus listeners in HomeScreen, ChatScreen, RunScreen

**ISSUE 20: No Cross-Screen Data Invalidation**
- **Root Cause**: Screens don't know when other screens modify data
- **Impact**: Data inconsistency across screens
- **Missing**: Event bus or state management for data changes

**ISSUE 21: No Pull-to-Refresh**
- **Root Cause**: Screens don't have RefreshControl
- **Impact**: User can't manually refresh stale data
- **Missing**: RefreshControl on ScrollViews

### Recommended Fixes

1. **Add useFocusEffect to All Screens**
   - Reload data when screen becomes active
   - Use React Navigation's `useFocusEffect` hook
   - Debounce to avoid excessive reloads

2. **Implement Data Invalidation Events**
   - Emit events when data changes (workout logged, run completed)
   - Listen to events in other screens
   - Trigger refresh when relevant data changes

3. **Add Pull-to-Refresh**
   - Add RefreshControl to all ScrollViews
   - Trigger data reload on pull
   - Show loading indicator

---

## 9. DATABASE SCHEMA ALIGNMENT

### WatermelonDB vs Supabase Schema Comparison

**VERIFIED TABLES:**

| Table | WatermelonDB | Supabase | Sync Status | Issues |
|-------|--------------|----------|-------------|--------|
| `workout_logs` | ✅ v11 | ✅ Exists | 🟡 Partial | UUID mismatch, missing columns |
| `sets` | ✅ v11 | ✅ Exists | 🟡 Partial | Synced but schema differences |
| `runs` | ✅ v11 | ✅ Exists | ❌ NOT SYNCED | No sync method |
| `readiness_scores` | ✅ v11 | ✅ Exists | ❌ NOT SYNCED | No sync method |
| `pr_history` | ✅ v11 | ✅ Exists | ❌ NOT SYNCED | No sync method |
| `messages` | ✅ v11 | ❌ MISSING | ❌ NOT SYNCED | Supabase table doesn't exist |
| `programs` | ✅ v11 | ✅ Exists | ❌ NOT SYNCED | No sync method |
| `workout_templates` | ✅ v11 | ✅ Exists | ❌ NOT SYNCED | No sync method |
| `scheduled_workouts` | ✅ v11 | ✅ Exists | ❌ NOT SYNCED | No sync method |
| `injury_logs` | ✅ v11 | ❌ Unknown | ❌ NOT SYNCED | Need to verify |
| `user_badges` | ✅ v11 | ❌ Unknown | ❌ NOT SYNCED | Need to verify |
| `user_streaks` | ✅ v11 | ❌ Unknown | ❌ NOT SYNCED | Need to verify |

### Schema Mismatches Found

**workout_logs Table:**
- ❌ WatermelonDB has `workout_name`, `start_time`, `end_time` (legacy fields)
- ❌ Supabase expects `exercise_id`, `workout_date`, `set_number` (new schema)
- ❌ Queries reference non-existent `duration_seconds` column
- ⚠️ Schema version mismatch between local and cloud

**runs Table:**
- ⚠️ Need to verify Supabase schema matches WatermelonDB
- ⚠️ `route` field is JSON string - may need special handling
- ⚠️ `workout_type` and `workout_name` fields may not exist in Supabase

**messages Table:**
- ❌ Supabase table DOES NOT EXIST
- ✅ WatermelonDB schema defined
- 🔴 CRITICAL: Chat messages can't sync to cloud

### Recommended Fixes

1. **Create Missing Supabase Tables**
   - Add migration for `messages` table
   - Verify `injury_logs`, `user_badges`, `user_streaks` tables exist
   - Match WatermelonDB schema exactly

2. **Align workout_logs Schema**
   - Decide on single source of truth (new schema vs legacy)
   - Update mobile app to use consistent schema
   - Add migration to handle legacy data

3. **Verify runs Table Schema**
   - Query Supabase to get actual schema
   - Compare with WatermelonDB schema
   - Fix any mismatches before implementing sync

---

## 10. SUPABASE QUERY PATTERNS

### Current Query Issues

**Pattern 1: UUID vs String Mismatch**
```typescript
// ❌ BROKEN - user_id is UUID in database, string in query
.eq('user_id', userId)  // userId is string from auth

// ✅ FIX - Cast to UUID or ensure proper type
.eq('user_id', userId)  // Supabase client should handle this
```

**Pattern 2: Missing Column References**
```typescript
// ❌ BROKEN - duration_seconds doesn't exist
.select('id, workout_date, duration_seconds, weight_used')

// ✅ FIX - Remove non-existent column
.select('id, workout_date, weight_used, reps_completed')
```

**Pattern 3: Silent Error Handling**
```typescript
// ❌ BROKEN - Returns zeros, hides errors
} catch (error) {
  console.error('Failed:', error);
  return { workoutCount: 0, totalVolume: 0 };
}

// ✅ FIX - Surface errors, add validation
} catch (error) {
  console.error('Failed to fetch weekly stats:', error);
  console.error('User ID:', userId);
  console.error('Query details:', { /* ... */ });
  throw error; // Or show user-friendly error
}
```

### Recommended Query Patterns

1. **Always Log Query Details on Error**
   - Log user ID, date ranges, filters
   - Log actual error message
   - Log expected vs actual data

2. **Validate Data Before Returning**
   - Check if result is empty when data expected
   - Verify data types match expectations
   - Alert if schema mismatch detected

3. **Use Type-Safe Queries**
   - Define TypeScript interfaces for query results
   - Use Supabase generated types
   - Validate response shape

---

## 11. PRIORITY TASK LIST

### CRITICAL (Fix Immediately)

**P0 - Data Loss Prevention:**
- [ ] **Add syncRunsToSupabase() to SyncService** - Runs not backing up to cloud
- [ ] **Create Supabase messages table** - Chat history lost forever
- [ ] **Add syncMessagesToSupabase() to SyncService** - Enable chat backup
- [ ] **Fix UUID mismatch in SupabaseAnalyticsService** - HomeScreen showing zeros
- [ ] **Add useFocusEffect to HomeScreen** - Stale data on screen return

**P1 - Core Functionality:**
- [ ] **Persist ChatScreen messages to WatermelonDB** - Messages lost on app close
- [ ] **Add syncReadinessScoresToSupabase()** - Readiness data not backing up
- [ ] **Add syncPRHistoryToSupabase()** - PR records not backing up
- [ ] **Remove duration_seconds column reference** - Query failing
- [ ] **Add pull-to-refresh to all screens** - User can't manually refresh

### HIGH (Fix Soon)

**P2 - Data Integrity:**
- [ ] **Verify runs table schema alignment** - Prevent sync failures
- [ ] **Add bidirectional sync for all tables** - Enable multi-device support
- [ ] **Implement conflict resolution** - Handle concurrent edits
- [ ] **Add sync status indicator** - Show user what's pending
- [ ] **Validate settings before saving** - Prevent invalid states

**P3 - User Experience:**
- [ ] **Add run analytics to HomeScreen** - Show run progress
- [ ] **Add voice run logging to ChatScreen** - Conversational run tracking
- [ ] **Sync user profile to Supabase** - Profile data persistence
- [ ] **Sync user preferences to cloud** - Cross-device settings
- [ ] **Add data invalidation events** - Cross-screen consistency

### MEDIUM (Nice to Have)

**P4 - Enhancements:**
- [ ] **Add chat preferences** - Personalized chat experience
- [ ] **Integrate run coaching in chat** - AI run recommendations
- [ ] **Add session persistence** - Restore chat context
- [ ] **Add retry logic to sync** - Handle network failures
- [ ] **Add sync queue management** - Optimize sync performance

---

## 12. TESTING CHECKLIST

### Data Flow Tests

**HomeScreen ↔ ChatScreen:**
- [ ] Log workout in Chat → Switch to Home → Verify data updates
- [ ] Close app → Reopen → Verify chat history persisted
- [ ] Log workout in Chat → Pull to refresh Home → Verify new data

**HomeScreen ↔ RunScreen:**
- [ ] Complete run → Switch to Home → Verify run stats appear
- [ ] Complete run → Check Supabase → Verify run synced to cloud
- [ ] Uninstall/reinstall app → Verify runs restored from cloud

**ChatScreen ↔ RunScreen:**
- [ ] Say "I ran 5 miles" in Chat → Verify run logged
- [ ] Ask "Should I run today?" → Verify readiness-based response

**Sync Service:**
- [ ] Create workout offline → Go online → Verify syncs to Supabase
- [ ] Create run offline → Go online → Verify syncs to Supabase
- [ ] Send chat message offline → Go online → Verify syncs to Supabase
- [ ] Modify data on Device A → Open Device B → Verify data synced

**Navigation & Refresh:**
- [ ] Log workout → Switch screens → Return → Verify data refreshed
- [ ] Pull to refresh on each screen → Verify data reloads
- [ ] Background app → Foreground → Verify data still fresh

---

## 13. ESTIMATED FIX TIME

| Priority | Tasks | Estimated Time |
|----------|-------|----------------|
| P0 (Critical) | 5 tasks | 8-12 hours |
| P1 (High) | 5 tasks | 6-8 hours |
| P2 (Medium) | 5 tasks | 4-6 hours |
| P3 (Low) | 5 tasks | 4-6 hours |
| **TOTAL** | **20 tasks** | **22-32 hours** |

**Recommended Approach:**
1. Fix P0 tasks first (1-2 days)
2. Test thoroughly after each fix
3. Move to P1 tasks (1 day)
4. Reassess priorities based on user feedback
5. Schedule P2/P3 for future sprints

---

## 14. SUCCESS CRITERIA

### Data Integrity
- ✅ All data types sync to Supabase within 30 seconds
- ✅ No data loss on app uninstall/reinstall
- ✅ Multi-device sync works correctly
- ✅ Conflicts resolved without data loss

### User Experience
- ✅ Screens show fresh data when navigating
- ✅ Pull-to-refresh works on all screens
- ✅ Sync status visible to user
- ✅ No stale data displayed

### Code Quality
- ✅ All queries have proper error handling
- ✅ Schema mismatches resolved
- ✅ Type safety enforced
- ✅ Comprehensive test coverage

---

## 15. CONCLUSION

**Current State:**
- 🔴 **CRITICAL**: 83% of data types not syncing to cloud
- 🔴 **CRITICAL**: Chat messages lost on app close
- 🔴 **CRITICAL**: Runs not backing up to Supabase
- 🟡 **HIGH**: Stale data shown when navigating between screens
- 🟡 **HIGH**: No multi-device support for most data

**After Fixes:**
- ✅ All data types sync to cloud
- ✅ Chat history persisted and synced
- ✅ Runs backed up to Supabase
- ✅ Fresh data on screen navigation
- ✅ Multi-device support enabled

**Next Steps:**
1. Review this audit with team
2. Prioritize P0 tasks
3. Create detailed implementation plan
4. Begin fixes with testing
5. Monitor sync performance in production

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Author:** Augment Agent
**Status:** Ready for Review

## 3. CHATSCREEN ↔ RUNSCREEN

### Current Implementation

**No Direct Interaction:**
- ChatScreen and RunScreen don't currently communicate
- User can't start/stop runs via chat
- User can't log runs via voice in chat

### Issues Found

**ISSUE 7: No Voice Run Logging**
- **Missing Feature**: User can't say "I ran 5 miles in 40 minutes" in chat
- **Backend**: Backend has `/api/runs/log` endpoint but mobile doesn't use it
- **Impact**: User must manually use RunScreen, can't use conversational interface

**ISSUE 8: No Run Coaching in Chat**
- **Missing Feature**: User can't ask "Should I run today?" based on readiness
- **Backend**: Backend has fatigue monitoring but not integrated with chat
- **Impact**: Chat feels disconnected from run training

### Recommended Fixes

1. **Add Run Logging to Chat Classifier**
   - Update LocalChatClassifier to detect run logging patterns
   - Add "run_log" message type
   - Parse run data and call backend `/api/runs/log` endpoint

2. **Integrate Run Coaching**
   - Allow chat to query readiness scores
   - Provide run recommendations based on fatigue
   - Show recent run stats when asked

---


