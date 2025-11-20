# Task List Revision Summary - Unified Dashboard Architecture

## What's Changing

### **OLD PLAN** (Enterprise-only dashboard)
- Build separate enterprise dashboard for coaches
- CSV import for bulk program creation
- Client management for coaches
- No premium user web access

### **NEW PLAN** (Unified Premium + Coach dashboard)
- Build **one dashboard** with two modes:
  1. Premium users see their own data
  2. Coaches can select and view any client's data
- Same AI chat interface for both (scoped to user/client)
- Premium users get web access to their data
- Coaches get iOS client management features

---

## Tasks to ADD

### **Database & Authorization**
1. Create `coach_client_invitations` table migration
2. Update `client_assignments` table (add revocation fields)
3. Update `user_profiles` table (add user_type field)
4. Create RLS policies for coach→client data access
5. Create invitation API endpoints (invite, accept, decline, revoke)

### **Web Dashboard - Shared Components**
6. Create shared AIChat component (accepts userId/clientId prop)
7. Create shared Analytics component (accepts userId/clientId prop)
8. Create shared Calendar component (accepts userId/clientId prop)
9. Create shared HealthInsights component
10. Create shared ProgramBuilder component
11. Create DashboardLayout (detects user type: premium vs coach)

### **Web Dashboard - Premium User Mode**
12. Create premium user routes (/dashboard/*)
13. Implement premium user authentication
14. Wire shared components to show own data

### **Web Dashboard - Coach Mode**
15. Create ClientSelector component (dropdown to switch clients)
16. Create ClientList page (all assigned clients)
17. Create coach routes (/coach/clients/{clientId}/*)
18. Implement coach authentication
19. Wire shared components to show selected client's data
20. Create InviteClient UI
21. Create TeamManagement UI

### **iOS - Coach Features**
22. Create ClientSelectorScreen (list of clients)
23. Create ClientSelectorHeader component (shows current client in nav)
24. Create InviteClientScreen
25. Create coach.store.ts (manages selectedClientId state)
26. Update ChatScreen to accept clientId prop
27. Update CalendarScreen to accept clientId prop
28. Update AnalyticsScreen to accept clientId prop
29. Add client selector to navigation

### **API Endpoints**
30. POST /api/coach/invite-client
31. GET /api/coach/invitations
32. POST /api/client/accept-invitation
33. POST /api/client/decline-invitation
34. DELETE /api/client/revoke-coach-access
35. GET /api/coach/clients (list all assigned clients)
36. GET /api/coach/clients/{clientId} (get client details)
37. GET /api/coach/clients/{clientId}/workouts
38. GET /api/coach/clients/{clientId}/analytics
39. POST /api/coach/chat (AI chat scoped to clientId)
40. GET /api/dashboard/my-data (premium user analytics)
41. POST /api/dashboard/chat (premium user AI chat)

---

## Tasks to MODIFY

### **P5 - Enterprise Dashboard Tasks**
**OLD**: Build enterprise-only dashboard with CSV import
**NEW**: Build unified dashboard with Premium + Coach modes

**Specific Changes**:
- P5.3 tasks: Change from "enterprise dashboard" to "unified dashboard"
- Add "user type detection" to layout
- Add "client selector" component
- Split routes: `/dashboard/*` (premium) vs `/coach/*` (coach)
- Keep CSV import (coach-only, web-only)

### **AI Chat Endpoints**
**OLD**: Single chat endpoint for user's own data
**NEW**: Two chat endpoints:
- `/api/dashboard/chat` (premium user, own data)
- `/api/coach/chat` (coach, selected client's data)

**Changes Needed**:
- Update chat endpoints to accept optional `clientId` parameter
- Add authorization check: coach can only access assigned clients
- Update AI context builder to use `clientId` when provided

---

## Tasks to REMOVE

None! Everything in the original plan is still needed. We're **adding** features, not removing them.

---

## Estimated Additional Work

| Category | Tasks | Estimated Time |
|----------|-------|----------------|
| Database & Auth | 5 tasks | 3-5 days |
| Web Shared Components | 6 tasks | 1 week |
| Web Premium Mode | 3 tasks | 2-3 days |
| Web Coach Mode | 7 tasks | 1 week |
| iOS Coach Features | 8 tasks | 1 week |
| API Endpoints | 12 tasks | 1 week |
| **TOTAL** | **41 new tasks** | **4-5 weeks** |

**Combined with existing P5 work**: ~6-8 weeks total for full dashboard implementation

---

## Priority Order

1. **Database & Authorization** (blocking everything else)
2. **API Endpoints** (needed for both web and iOS)
3. **Web Shared Components** (core functionality)
4. **Web Premium Mode** (simpler, validates shared components)
5. **Web Coach Mode** (builds on premium mode)
6. **iOS Coach Features** (final polish)

---

## What Stays the Same

✅ All P0-P4 work (calendar, wearables, health, personalization, multi-sport)
✅ CSV import functionality (just coach-only now)
✅ Backend services (all still needed)
✅ Database migrations for wearables, health, preferences, etc.
✅ Mobile UI components for calendar, health insights, etc.

---

## Next Steps

1. Review this revision with user
2. Update main task list with new tasks
3. Reorganize P5 tasks to reflect unified dashboard
4. Add new sections for:
   - Database & Authorization (P5.1)
   - Web Shared Components (P5.2)
   - Premium User Dashboard (P5.3)
   - Coach Dashboard (P5.4)
   - iOS Coach Features (P5.5)
5. Begin implementation starting with database schema

