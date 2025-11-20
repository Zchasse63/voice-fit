# VoiceFit Expansion - Session Summary

**Date**: January 19, 2025  
**Session Focus**: Architecture revision for unified Premium + Coach dashboard

---

## Major Architectural Decision

### **OLD PLAN**: Enterprise-Only Dashboard
- Separate dashboard for coaches/teams only
- CSV import for bulk program creation
- No web access for premium individual users

### **NEW PLAN**: Unified Premium + Coach Dashboard
- **One dashboard** with two access modes:
  1. **Premium User Mode**: Individual athletes view their own data
  2. **Coach Mode**: Coaches can select and view any assigned client's data
- **Same AI chat interface** for both (scoped to user/client)
- **Same analytics, calendar, health insights** for both
- Premium users get web access to their data
- Coaches get iOS client management features

---

## Key Benefits of New Architecture

1. **Less Code Duplication**: One dashboard, two modes instead of two separate dashboards
2. **Consistent UX**: Same AI chat and analytics everywhere
3. **Better Value for Premium Users**: Web access for deeper data analysis
4. **Coaches Get Full AI Power**: Can ask questions about client data just like clients can
5. **iOS Coach Features**: Coaches can manage clients on mobile, not just web

---

## User Types & Access Matrix

| Feature | Free | Premium | Coach/Admin |
|---------|------|---------|-------------|
| **iOS App** | ✅ Basic | ✅ Full | ✅ Full + Client Selector |
| **Web Dashboard** | ❌ None | ✅ Own Data | ✅ Multi-Client |
| **AI Chat** | ✅ iOS only | ✅ iOS + Web | ✅ iOS + Web (scoped to selected client) |
| **Analytics** | ❌ None | ✅ Own Data | ✅ Any Client |
| **CSV Import** | ❌ | ❌ | ✅ Web only |
| **Team Management** | ❌ | ❌ | ✅ Web only |
| **Client Management** | ❌ | ❌ | ✅ iOS + Web |

---

## Authorization Flow (Coach ↔ Client)

### **1. Coach Invites Client**
- Coach sends invitation via email
- System creates record in `coach_client_invitations` table
- Invitation includes unique code and expiry (7 days)

### **2. Client Accepts Invitation**
- Client receives email, clicks link
- Logs into iOS/Web, sees invitation
- Accepts → creates `client_assignments` record
- Coach now has access to client's data

### **3. Client Can Revoke Access**
- Client can remove coach access anytime
- Updates `client_assignments` status to 'inactive'
- Coach loses access immediately

---

## Database Schema Changes Needed

### **New Table: coach_client_invitations**
```sql
CREATE TABLE coach_client_invitations (
  id UUID PRIMARY KEY,
  coach_id UUID REFERENCES coach_profiles(id),
  client_email VARCHAR(255),
  organization_id UUID REFERENCES organizations(id),
  status VARCHAR(50) DEFAULT 'pending',
  invitation_code VARCHAR(100) UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Update: client_assignments**
- Add `revoked_at TIMESTAMPTZ`
- Add `revoked_by VARCHAR(50)` (client, coach, admin)

### **Update: user_profiles**
- Add `user_type VARCHAR(50)` (free, premium, coach)

---

## Work Completed This Session

### ✅ **AI Model Corrections (P0 - CRITICAL)**
- Fixed all 6 backend services to use `grok-4-fast-reasoning`
- Files fixed:
  - `schedule_optimization_service.py`
  - `health_intelligence_service.py`
  - `personalization_service.py`
  - `warmup_cooldown_service.py`
  - `csv_import_service.py`
  - `voice_session_service.py`

### ✅ **Backend Integration**
- Added all service imports to `main.py`
- Created dependency injection functions for 7 services
- Added 21 new API endpoints:
  - Wearables (4 endpoints)
  - Personalization (3 endpoints)
  - Warmup/Cooldown (4 endpoints)
  - CSV Import (5 endpoints)
  - Voice Sessions (5 endpoints)

### ✅ **Voice Session Integration**
- Added `session_id` parameter to request models:
  - `VoiceParseRequest`
  - `CoachQuestionRequest`
  - `ChatClassifyRequest`
- Maintains backward compatibility (session_id is optional)

### ✅ **Test Files Created**
- `test_schedule_optimization.py` (150 lines)
- `test_health_intelligence.py` (150 lines)
- `test_personalization.py` (150 lines)
- `test_warmup_cooldown.py` (150 lines)

### ✅ **Documentation Created**
- `DASHBOARD_ARCHITECTURE_REVISION.md` - Complete new architecture
- `TASK_LIST_REVISION_SUMMARY.md` - What's changing and why
- `SESSION_SUMMARY.md` - This document

---

## Task List Reorganization

**New task structure** with 68 new tasks added:

1. **P5.1 - Database & Authorization** (5 tasks)
   - Create invitation table
   - Update RLS policies
   - Create invitation API endpoints

2. **P5.2 - Web Dashboard Shared Components** (6 tasks)
   - AIChat, Analytics, Calendar, HealthInsights, ProgramBuilder
   - DashboardLayout (detects user type)

3. **P5.3 - Premium User Dashboard** (4 tasks)
   - Premium routes, authentication
   - Wire shared components to own data

4. **P5.4 - Coach Dashboard** (8 tasks)
   - Client selector, client list
   - Coach routes, authentication
   - Wire shared components to selected client data
   - Invite client UI, team management

5. **P5.5 - CSV Import** (2 tasks)
   - CSV upload UI
   - Wire to existing endpoints

6. **P5.6 - iOS Coach Features** (8 tasks)
   - Client selector screen
   - Client management
   - Update screens to accept clientId prop

---

## Next Steps (In Priority Order)

### **Immediate (Continue Testing)**
1. Create `test_csv_import.py`
2. Create `test_voice_session.py`
3. Create `test_wearables_ingestion.py`
4. Run full test suite

### **Phase 1: Database & Authorization** (3-5 days)
1. Create `coach_client_invitations` table migration
2. Update `client_assignments` and `user_profiles` tables
3. Create RLS policies for coach→client data access
4. Create invitation API endpoints

### **Phase 2: Web Dashboard Core** (1-2 weeks)
1. Build shared components (AIChat, Analytics, Calendar)
2. Create dashboard layout with user type detection
3. Implement premium user dashboard
4. Implement coach dashboard with client selector

### **Phase 3: iOS Coach Features** (1 week)
1. Create client selector components
2. Update screens to support clientId prop
3. Add client management screens

### **Phase 4: Complete P0-P4** (2-3 weeks)
1. Calendar drag-and-drop, conflict detection
2. Wearables OAuth flows
3. Health intelligence UI
4. Multi-sport support

### **Phase 5: P6-P7** (1-2 weeks)
1. Voice session timeout handling
2. Live Activity Swift implementation

---

## Estimated Remaining Work

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Testing Infrastructure | 4 tasks | 2-3 days |
| Database & Authorization | 5 tasks | 3-5 days |
| Web Shared Components | 6 tasks | 1 week |
| Premium Dashboard | 4 tasks | 2-3 days |
| Coach Dashboard | 8 tasks | 1 week |
| iOS Coach Features | 8 tasks | 1 week |
| P0-P4 Completion | ~40 tasks | 2-3 weeks |
| P6-P7 Completion | ~15 tasks | 1-2 weeks |
| **TOTAL** | **~90 tasks** | **8-12 weeks** |

---

## Files Modified This Session

### Backend
- `apps/backend/schedule_optimization_service.py`
- `apps/backend/health_intelligence_service.py`
- `apps/backend/personalization_service.py`
- `apps/backend/warmup_cooldown_service.py`
- `apps/backend/csv_import_service.py`
- `apps/backend/voice_session_service.py`
- `apps/backend/main.py` (major additions)
- `apps/backend/models.py` (session_id additions)

### Tests Created
- `apps/backend/test_schedule_optimization.py`
- `apps/backend/test_health_intelligence.py`
- `apps/backend/test_personalization.py`
- `apps/backend/test_warmup_cooldown.py`

### Documentation Created
- `Zed/DASHBOARD_ARCHITECTURE_REVISION.md`
- `Zed/TASK_LIST_REVISION_SUMMARY.md`
- `Zed/SESSION_SUMMARY.md`

---

## Key Decisions Made

1. **Unified Dashboard**: One codebase for Premium + Coach instead of separate dashboards
2. **AI Chat Scoping**: Pass `userId` or `clientId` to all AI endpoints
3. **Authorization Model**: Invitation-based with client revocation rights
4. **iOS Coach Features**: Full client management on mobile, not just web
5. **CSV Import**: Web-only feature for coaches (not on iOS)

---

## Questions Answered

✅ How does coach get access to client? → Invitation flow with acceptance  
✅ Can client revoke access? → Yes, anytime  
✅ Do coaches use iOS app? → Yes, with client selector  
✅ Do premium users get web access? → Yes, to their own data  
✅ Is chat scoped to selected client? → Yes, when coach viewing client  

---

## Status: Ready to Continue

All critical blockers resolved. Test infrastructure in place. Architecture clearly defined. Ready to continue with remaining test files and then move to database schema implementation.

