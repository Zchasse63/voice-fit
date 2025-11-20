# Dashboard Architecture Revision - Premium + Coach Unified Design

## Executive Summary

**Major Change**: Instead of building separate "Enterprise Dashboard" and "Premium User Dashboard", we're building **one unified dashboard** with two access modes:

1. **Premium User Mode**: Individual athletes view their own data
2. **Coach Mode**: Coaches can select and view any assigned client's data

Both modes have the **same AI chat interface** and analytics features, just scoped to different data.

---

## 🎨 CRITICAL DESIGN REQUIREMENT

**The web dashboard MUST use the same UI principles, design system, and styling as the iOS app.**

This means:
- **Same color palette** (dark mode, accent colors, gradients)
- **Same typography** (font families, sizes, weights)
- **Same component styling** (buttons, inputs, cards, modals)
- **Same spacing and layout principles**
- **Same animations and transitions**
- **Same iconography**
- **Consistent user experience** across mobile and web

**Implementation Approach**:
1. Extract design tokens from iOS app (colors, spacing, typography)
2. Create matching Tailwind CSS configuration
3. Build web components that mirror iOS components visually
4. Ensure responsive design maintains the same feel on desktop

The web dashboard should feel like a desktop version of the iOS app, not a separate product.

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
```
Coach Dashboard → "Invite Client" → Enter email → System sends invitation
```

**Database**: Create record in `coach_client_invitations` table:
```sql
{
  id: uuid,
  coach_id: uuid,
  client_email: string,
  organization_id: uuid,
  status: 'pending' | 'accepted' | 'declined' | 'expired',
  invitation_code: string (unique),
  expires_at: timestamp,
  created_at: timestamp
}
```

### **2. Client Accepts Invitation**
```
Client receives email → Clicks link → Logs into iOS/Web → Sees invitation → Accepts
```

**Database**: Update invitation + create `client_assignments` record:
```sql
UPDATE coach_client_invitations SET status = 'accepted';
INSERT INTO client_assignments (client_user_id, coach_id, organization_id, status);
```

### **3. Client Can Revoke Access**
```
Client Settings → "Connected Coaches" → Select coach → "Remove Access"
```

**Database**: Update `client_assignments`:
```sql
UPDATE client_assignments SET status = 'inactive', revoked_at = NOW();
```

---

## Web Dashboard Architecture

### **Shared Core Components**
All users (Premium + Coach) see these:
- AI Chat Interface (scoped to current user/client)
- Analytics Dashboard (training volume, adherence, PRs)
- Calendar View (scheduled workouts, conflicts)
- Health Insights (wearables, recovery, nutrition)
- Program Builder (create/edit programs)
- Workout History

### **Coach-Only Components**
- **Client Selector** (dropdown/sidebar to switch between clients)
- **CSV Import** (bulk program upload)
- **Team Management** (invite coaches, manage organization)
- **Client List** (all assigned clients with status)

### **Component Structure**
```
components/
├── shared/              # Used by both Premium + Coach
│   ├── AIChat.tsx       # AI chat interface (accepts userId prop)
│   ├── Analytics.tsx    # Analytics dashboard (accepts userId prop)
│   ├── Calendar.tsx     # Calendar view (accepts userId prop)
│   ├── HealthInsights.tsx
│   └── ProgramBuilder.tsx
├── coach/               # Coach-only
│   ├── ClientSelector.tsx
│   ├── ClientList.tsx
│   ├── CSVImport.tsx
│   └── TeamManagement.tsx
└── layout/
    ├── DashboardLayout.tsx  # Detects user type, shows appropriate nav
    └── ClientScopedLayout.tsx  # Wraps content when coach viewing client
```

---

## iOS App Architecture

### **Premium User Flow**
- Standard app experience
- AI chat, voice logging, workouts, calendar
- No client selector

### **Coach Flow**
- **Client Selector** in navigation (tap to switch)
- When viewing a client:
  - All data scoped to that client
  - AI chat answers questions about that client
  - Can view workouts, calendar, health data
  - **Cannot** upload CSVs (web only)
- Can manage clients:
  - Invite new clients
  - View invitation status
  - Remove clients

### **Mobile Component Structure**
```
src/
├── screens/
│   ├── coach/
│   │   ├── ClientSelectorScreen.tsx
│   │   ├── ClientListScreen.tsx
│   │   └── InviteClientScreen.tsx
│   └── shared/
│       ├── ChatScreen.tsx (accepts clientId prop for coaches)
│       ├── CalendarScreen.tsx (accepts clientId prop)
│       └── AnalyticsScreen.tsx (accepts clientId prop)
├── components/
│   └── coach/
│       └── ClientSelectorHeader.tsx  # Shows current client in nav
└── stores/
    └── coach.store.ts  # Manages selected client state
```

---

## Database Schema Changes Needed

### **New Table: coach_client_invitations**
```sql
CREATE TABLE coach_client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coach_profiles(id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  status VARCHAR(50) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invitation_code VARCHAR(100) UNIQUE NOT NULL,
  
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Update Table: client_assignments**
Add revocation tracking:
```sql
ALTER TABLE client_assignments 
ADD COLUMN revoked_at TIMESTAMPTZ,
ADD COLUMN revoked_by VARCHAR(50) CHECK (revoked_by IN ('client', 'coach', 'admin'));
```

### **Update Table: user_profiles**
Add user type field:
```sql
ALTER TABLE user_profiles
ADD COLUMN user_type VARCHAR(50) DEFAULT 'free' 
  CHECK (user_type IN ('free', 'premium', 'coach'));
```

---

## API Endpoints Needed

### **Coach Invitation Flow**
```
POST   /api/coach/invite-client
GET    /api/coach/invitations
POST   /api/client/accept-invitation
POST   /api/client/decline-invitation
DELETE /api/client/revoke-coach-access
```

### **Client Data Access (Coach)**
```
GET    /api/coach/clients              # List all assigned clients
GET    /api/coach/clients/{clientId}   # Get client details
GET    /api/coach/clients/{clientId}/workouts
GET    /api/coach/clients/{clientId}/analytics
POST   /api/coach/chat                 # AI chat scoped to clientId
```

### **Premium User Dashboard**
```
GET    /api/dashboard/my-data          # Own analytics
POST   /api/dashboard/chat             # AI chat (own data)
```

---

## Implementation Priority

### **Phase 1: Database & Auth** (Week 1)
- [ ] Create coach_client_invitations table
- [ ] Update client_assignments table
- [ ] Update user_profiles with user_type
- [ ] Create invitation API endpoints
- [ ] Create RLS policies for coach data access

### **Phase 2: Web Dashboard Core** (Week 2-3)
- [ ] Shared components (AIChat, Analytics, Calendar)
- [ ] Dashboard layout with user type detection
- [ ] Premium user dashboard (own data)
- [ ] Coach client selector
- [ ] Coach viewing client data

### **Phase 3: iOS Coach Features** (Week 4)
- [ ] Client selector component
- [ ] Client list screen
- [ ] Invite client screen
- [ ] Scoped data views for coaches

### **Phase 4: CSV Import & Team Mgmt** (Week 5)
- [ ] CSV upload UI (web only)
- [ ] Team management (web only)

---

## Key Technical Decisions

1. **AI Chat Scoping**: Pass `userId` or `clientId` to all AI endpoints
2. **RLS Policies**: Coaches can SELECT client data via `client_assignments` join
3. **State Management**: 
   - Web: Zustand store for `selectedClientId`
   - iOS: Zustand store for `selectedClientId`
4. **URL Structure**:
   - Premium: `/dashboard/*`
   - Coach: `/coach/clients/{clientId}/*`

