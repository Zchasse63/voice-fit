# VoiceFit Unified MVP Roadmap - Investor-Ready Product

**Date**: November 25, 2025  
**Purpose**: Comprehensive roadmap merging internal and external audits for fundraising MVP  
**Goal**: Production-ready, investor-ready application demonstrating full VoiceFit vision

---

## Executive Summary

### Audit Comparison Overview

**Internal Audit Focus** (Our Analysis):
- Feature implementation completeness (TIER 1-3)
- Database schema gaps
- Frontend-backend integration
- External API setup requirements

**External Audit Focus** (Senior Architect):
- Production architecture quality
- Security vulnerabilities
- Authentication/authorization gaps
- UI/UX completeness
- Integration point mapping (129 endpoints)

### Critical Gaps Identified by External Audit (Not in Our Audit)

| Issue | Severity | Our Audit | External Audit | Impact |
|-------|----------|-----------|----------------|--------|
| **Auth disabled by default** | CRITICAL | ❌ Missed | ✅ Found | All endpoints unauthenticated |
| **localStorage in React Native** | CRITICAL | ❌ Missed | ✅ Found | Auth won't persist on mobile |
| **OAuth UI incomplete** | CRITICAL | ⚠️ Partial | ✅ Found | Apple/Google show fake alerts |
| **Missing /api/chat endpoint** | CRITICAL | ❌ Missed | ✅ Found | AI Chat fails in web app |
| **Missing /api/coach/clients** | CRITICAL | ❌ Missed | ✅ Found | Coach dashboard broken |
| **Missing /api/workouts/{userId}** | CRITICAL | ❌ Missed | ✅ Found | Calendar fails in web |
| **CSV param mismatch** | CRITICAL | ❌ Missed | ✅ Found | B2B import fails |
| **Access tokens in localStorage** | HIGH | ❌ Missed | ✅ Found | XSS vulnerability |
| **No password reset flow** | HIGH | ❌ Missed | ✅ Found | Users can't recover accounts |
| **No fine-grained route protection** | HIGH | ❌ Missed | ✅ Found | Free users access premium |
| **Rate limiting fails open** | HIGH | ❌ Missed | ✅ Found | No protection if Redis down |

### New Issues Discovered (11 Critical + 17 High Priority)

**Total Issues**: 49 (11 Critical, 17 High, 21 Medium)

---

## Revised Implementation Status

### What We Thought vs Reality

| Component | Our Assessment | External Assessment | Gap |
|-----------|---------------|---------------------|-----|
| Backend APIs | 90% complete | Functional but auth disabled | -40% |
| Frontend-Backend | 40% complete | Critical mismatches found | -20% |
| Authentication | Needs JWT fix | Completely broken | -60% |
| Database Schema | 60% complete | Well-designed but gaps | Same |
| External APIs | 0% (known) | 0% (confirmed) | Same |
| UI/UX | Not assessed | Needs improvement | New |

**Revised Overall Completion**: 45-50% (down from 60-70%)

---

## Critical Blockers for MVP (Must Fix First)

### Phase 0: Emergency Fixes (1-2 days, 8-12 hours)

These are **CRITICAL** issues that will cause complete failure:

#### 1. Fix Authentication System (4-5 hours)

**Issues**:
- ❌ `REQUIRE_AUTH=false` by default in `main.py:377`
- ❌ `localStorage` instead of `AsyncStorage` in `auth.store.ts:234`
- ❌ OAuth UI buttons not connected to actual auth flow
- ❌ Empty JWT secret default allows bypass

**Fixes**:
```python
# main.py:377
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"  # Change default to "true"
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
if not SUPABASE_JWT_SECRET:
    raise ValueError("SUPABASE_JWT_SECRET is required")
```

```typescript
// auth.store.ts:234
import AsyncStorage from '@react-native-async-storage/async-storage';
storage: createJSONStorage(() => AsyncStorage)  // Fix mobile persistence
```

**Connect OAuth UI**:
- Wire SignIn/SignUp buttons to `useAuthStore` methods
- Test with real Supabase OAuth providers
- Remove fake alerts

#### 2. Implement Missing Critical Endpoints (3-4 hours)

**Web App Failures** (External audit found these):
```python
# Missing endpoints causing 404 errors
@app.post("/api/chat")  # AIChat.tsx:64 calls this
@app.get("/api/coach/clients")  # CSVImport.tsx:151 calls this
@app.get("/api/workouts/{userId}")  # Calendar.tsx:42 calls this
```

**CSV Import Fixes**:
```python
# Fix parameter mismatch
@app.post("/api/csv/analyze")
async def analyze_csv(
    file_data: dict = Body(...),  # Use Body() not Query()
    user: dict = Depends(verify_token)
):
    pass

@app.post("/api/csv/import")
async def import_csv(
    coach_id: str,  # Add missing parameter
    file_data: dict = Body(...),
    user: dict = Depends(verify_token)
):
    pass
```

#### 3. Fix Mobile Auth Headers (2-3 hours)

**Issue**: All 13 mobile components + web components missing auth headers

**Create Centralized Client** (same as our audit):
```typescript
// apps/mobile/src/config/api.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://voicefit.railway.app';

export const getAuthHeaders = () => {
  const { session } = useAuthStore.getState();
  if (!session?.access_token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  };
};
```

**Fix Web Components Too**:
- `apps/web/src/components/AIChat.tsx`
- `apps/web/src/components/Calendar.tsx`
- `apps/web-dashboard/src/components/coach/CSVImport.tsx`

#### 4. Database Migrations (30 min)

**Same as our audit** - Apply all migrations:
```bash
cd supabase && npx supabase db push
```

**Deliverable**: ✅ Authentication works, critical endpoints exist, API calls succeed

---

## Phase 1: Security & Stability (2-3 days, 12-16 hours)

### High Priority Security Issues

#### 1. Implement Password Reset Flow (2-3 hours)

**Currently Missing** (External audit found):
- No "Forgot Password" link in SignInScreen
- No password reset email flow
- No password complexity validation

**Implementation**:
```typescript
// SignInScreen.tsx
const handlePasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'voicefit://reset-password'
  });
  if (error) Alert.alert('Error', error.message);
  else Alert.alert('Success', 'Check your email for reset link');
};
```

#### 2. Add Route Protection (3-4 hours)

**Issues**:
- Free users can access premium features
- Clients can access coach screens
- No tier-based access control

**Implementation**:
```typescript
// Create useRequireAuth hook
export const useRequireAuth = (requiredTier?: 'free' | 'premium' | 'coach') => {
  const { user, session } = useAuthStore();
  const navigation = useNavigation();

  useEffect(() => {
    if (!session) {
      navigation.navigate('SignIn');
      return;
    }

    const userTier = user?.user_metadata?.tier || 'free';
    if (requiredTier && userTier !== requiredTier) {
      Alert.alert('Upgrade Required', 'This feature requires premium');
      navigation.goBack();
    }
  }, [session, user]);
};

// Use in screens
function PremiumScreen() {
  useRequireAuth('premium');
  // ...
}
```

#### 3. Fix Rate Limiting (1-2 hours)

**Issue**: Rate limiting fails open if Redis unavailable

**Fix**:
```python
# rate_limit_middleware.py:156
try:
    # Check rate limit
    pass
except RedisError:
    # Fail closed instead of open
    raise HTTPException(status_code=503, detail="Service temporarily unavailable")
```

#### 4. Add Email Verification (2-3 hours)

**Currently Missing**:
- Users can sign up without email confirmation
- No verification required

**Implementation**:
```typescript
// SignUpScreen.tsx
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: 'voicefit://verify-email',
    data: { tier: 'free' }
  }
});

if (!error) {
  Alert.alert('Verify Email', 'Check your email to verify your account');
}
```

#### 5. Implement Token Revocation (2-3 hours)

**Issue**: No way to invalidate tokens on logout/security events

**Implementation**:
```python
# Create token blacklist in Redis
async def revoke_token(token: str):
    redis_client.setex(f"revoked:{token}", 86400, "1")  # 24 hour TTL

async def verify_token(authorization: str = Header(None)):
    # ... existing verification ...

    # Check if revoked
    if redis_client.exists(f"revoked:{token}"):
        raise HTTPException(status_code=401, detail="Token revoked")
```

**Deliverable**: ✅ Secure authentication, proper authorization, token management

---

## Phase 2: UI/UX Completeness (3-4 days, 20-28 hours)

### Critical UI Gaps (External Audit Found)

#### 1. Create Missing UI Components (8-12 hours)

**Component Library Gaps**:
```typescript
// apps/mobile/src/components/common/Toast.tsx
export function Toast({ message, type }: ToastProps) {
  // Non-blocking notification system
}

// apps/mobile/src/components/common/ConfirmDialog.tsx
export function ConfirmDialog({ title, message, onConfirm }: ConfirmDialogProps) {
  // For destructive actions
}

// apps/mobile/src/components/common/EmptyState.tsx
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  // For all data-loading screens
}

// apps/mobile/src/components/common/BottomSheet.tsx
export function BottomSheet({ children }: BottomSheetProps) {
  // Rich modals
}
```

#### 2. Fix Screen Issues (6-8 hours)

**OnboardingScreen**:
- ❌ No back button
- ❌ No completion persistence
- ✅ Fix: Add navigation, save progress to Supabase

**ChatScreen**:
- ❌ No loading history
- ❌ Missing typing indicator
- ✅ Fix: Add message history fetch, typing animation

**ProgramLogScreen**:
- ❌ No "Today" button
- ❌ No pagination
- ✅ Fix: Add quick navigation, infinite scroll

#### 3. Accessibility Improvements (4-6 hours)

**Issues**:
- Emoji as button text (❌ "🏃" button)
- No screen reader labels on data
- Color-only state indicators

**Fixes**:
```typescript
<TouchableOpacity
  accessibilityLabel="Start run"
  accessibilityHint="Begins tracking your running workout"
  accessibilityRole="button"
>
  <Icon name="play" />
  <Text>Start Run</Text>
</TouchableOpacity>
```

#### 4. Add Loading & Error States (2-4 hours)

**Pattern for All Screens**:
```typescript
{isLoading && <SkeletonLoader />}
{error && <ErrorMessage message={error} onRetry={refetch} />}
{!data && !isLoading && <EmptyState title="No data yet" />}
{data && <DataDisplay data={data} />}
```

**Deliverable**: ✅ Professional UI, accessible, proper feedback

---

## Phase 3: Feature Integration (4-5 days, 28-36 hours)

### Integrate Existing Components into Screens

#### 1. AI Health Intelligence Integration (6-8 hours)

**HomeScreen Updates**:
```typescript
// Add to HomeScreen.tsx
import { InsightsCard } from '../components/health-intelligence/InsightsCard';
import { ReadinessCard } from '../components/health-intelligence/ReadinessCard';

<ScrollView>
  <ReadinessCard userId={user.id} />
  <InsightsCard userId={user.id} limit={3} />
  {/* existing content */}
</ScrollView>
```

**RecoveryDetailScreen Updates**:
```typescript
import { InjuryRiskCard } from '../components/health-intelligence/InjuryRiskCard';
import { CorrelationsCard } from '../components/health-intelligence/CorrelationsCard';

<ScrollView>
  <InjuryRiskCard userId={user.id} />
  <CorrelationsCard userId={user.id} />
  {/* existing recovery data */}
</ScrollView>
```

#### 2. Wearable Data Integration (4-6 hours)

**WearablesScreen** (already has connection cards):
- ✅ WHOOPConnectionCard
- ✅ TerraConnectionCard
- ⚠️ Add: Sync status, last sync time, data preview

**RecoveryDetailScreen**:
```typescript
import { WHOOPRecoveryCard } from '../components/recovery/WHOOPRecoveryCard';

<ScrollView>
  <WHOOPRecoveryCard userId={user.id} />
  {/* Show recovery score, HRV, sleep quality */}
</ScrollView>
```

**NutritionScreen**:
```typescript
import { NutritionSummaryCard } from '../components/nutrition/NutritionSummaryCard';
import { ManualNutritionEntry } from '../components/nutrition/ManualNutritionEntry';

<ScrollView>
  <NutritionSummaryCard userId={user.id} date={today} />
  <ManualNutritionEntry userId={user.id} />
  {/* Terra nutrition data */}
</ScrollView>
```

#### 3. Create New Screens (12-16 hours)

**CrossFitScreen.tsx** (3-4 hours):
```typescript
export function CrossFitScreen() {
  return (
    <ScrollView>
      <WODInput onParse={handleParse} />
      <WODModificationCard wod={parsedWOD} />
      <WODHistory userId={user.id} />
    </ScrollView>
  );
}
```

**ProgramBuilderScreen.tsx** (4-5 hours):
```typescript
export function ProgramBuilderScreen() {
  const [programType, setProgramType] = useState<'sport' | 'hybrid'>();

  return (
    <ScrollView>
      <ProgramTypeSelector onChange={setProgramType} />
      {programType === 'sport' && <SportTrainingSelector />}
      {programType === 'hybrid' && <HybridAthleteSelector />}
      <GeneratedProgramDisplay />
    </ScrollView>
  );
}
```

**RacePlanningScreen.tsx** (3-4 hours):
```typescript
export function RacePlanningScreen() {
  return (
    <ScrollView>
      <RaceDayPlanner userId={user.id} />
      <UpcomingRaces userId={user.id} />
    </ScrollView>
  );
}
```

**VoiceCommandsScreen.tsx** (2-3 hours):
```typescript
export function VoiceCommandsScreen() {
  return (
    <ScrollView>
      <VoiceCommandCenter userId={user.id} />
      <CommandHistory userId={user.id} />
    </ScrollView>
  );
}
```

#### 4. Update Navigation (1-2 hours)

**Add to RootNavigator**:
```typescript
<Stack.Screen name="CrossFit" component={CrossFitScreen} />
<Stack.Screen name="ProgramBuilder" component={ProgramBuilderScreen} />
<Stack.Screen name="RacePlanning" component={RacePlanningScreen} />
<Stack.Screen name="VoiceCommands" component={VoiceCommandsScreen} />
```

**Add to HomeScreen Quick Actions**:
- "Build Program" → ProgramBuilderScreen
- "Plan Race" → RacePlanningScreen
- "CrossFit WOD" → CrossFitScreen

**Deliverable**: ✅ All features accessible and integrated

---

## Phase 4: Backend Completeness (3-4 days, 20-26 hours)

### Missing Endpoints & Data Normalization

#### 1. Nutrition Endpoints (3-4 hours)

```python
@app.post("/api/nutrition/manual-entry")
async def log_nutrition_manual(
    request: dict = Body(...),
    supabase: Client = Depends(get_supabase_client),
    user: dict = Depends(verify_token)
):
    # Insert into daily_nutrition_summary
    pass

@app.get("/api/nutrition/daily-summary")
async def get_daily_nutrition(
    user_id: str,
    date: str,
    user: dict = Depends(verify_token)
):
    # Aggregate from Terra + manual entries
    pass

@app.get("/api/nutrition/insights")
async def get_nutrition_insights(
    user_id: str,
    user: dict = Depends(verify_token)
):
    # Nutrition-to-performance correlations
    pass
```

#### 2. Running Shoe Endpoints (2-3 hours)

```python
@app.get("/api/shoes/list")
async def list_shoes(
    user_id: str,
    user: dict = Depends(verify_token)
):
    # Get all shoes with mileage
    pass

@app.post("/api/shoes/add")
async def add_shoe(
    request: dict = Body(...),
    user: dict = Depends(verify_token)
):
    # Add new shoe
    pass

@app.put("/api/shoes/{shoe_id}/update-mileage")
async def update_shoe_mileage(
    shoe_id: str,
    mileage: float,
    user: dict = Depends(verify_token)
):
    # Update shoe mileage
    pass
```

#### 3. Data Normalization (6-8 hours)

**Extend DataNormalizationService**:
```python
# data_normalization_service.py

def normalize_terra_activity(self, raw_data: dict) -> dict:
    """Normalize activity data from Terra"""
    return {
        'distance_meters': raw_data.get('distance_meters'),
        'duration_seconds': raw_data.get('duration_seconds'),
        'calories': raw_data.get('calories'),
        'avg_hr': raw_data.get('avg_hr'),
        'source': 'terra',
        'source_priority': 55
    }

def normalize_terra_sleep(self, raw_data: dict) -> dict:
    """Normalize sleep data from Terra"""
    return {
        'duration_hours': raw_data.get('duration_seconds') / 3600,
        'quality_score': raw_data.get('score'),
        'deep_sleep_minutes': raw_data.get('deep_sleep_duration_seconds') / 60,
        'source': 'terra',
        'source_priority': 55
    }

def normalize_stryd_power(self, raw_data: dict) -> dict:
    """Normalize Stryd power data"""
    return {
        'power_avg': raw_data.get('avg_power'),
        'power_max': raw_data.get('max_power'),
        'ground_contact_time': raw_data.get('gct'),
        'vertical_oscillation': raw_data.get('vo'),
        'source': 'stryd',
        'source_priority': 80
    }
```

#### 4. Webhook Security (2-3 hours)

**HMAC Signature Verification**:
```python
import hmac
import hashlib

def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str
) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

@app.post("/api/webhooks/terra")
async def terra_webhook(
    request: Request,
    x_terra_signature: str = Header(None)
):
    body = await request.body()

    if not verify_webhook_signature(
        body,
        x_terra_signature,
        os.getenv("TERRA_WEBHOOK_SECRET")
    ):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Process webhook
    pass
```

#### 5. Automatic Token Refresh (3-4 hours)

```python
# whoop_oauth_service.py

async def ensure_valid_token(self, user_id: str) -> str:
    """Ensure token is valid, refresh if needed"""
    connection = self.get_connection(user_id)

    # Check if token expires soon (within 1 hour)
    expires_at = connection['expires_at']
    if expires_at - time.time() < 3600:
        # Refresh token
        new_token = await self.refresh_access_token(
            connection['refresh_token']
        )
        return new_token['access_token']

    return connection['access_token']
```

**Deliverable**: ✅ Complete backend, secure webhooks, auto token refresh

---

## Phase 5: Web Dashboard (B2B Feature) (3-4 days, 18-24 hours)

### Coach Dashboard Implementation

#### 1. File Upload UI (4-6 hours)

**Create**: `apps/web-dashboard/src/components/coach/FileUploadHandler.tsx`
```typescript
export function FileUploadHandler() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/csv/parse', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${session.access_token}` }
    });

    const data = await response.json();
    // Show schema mapping UI
  };

  return (
    <div>
      <input type="file" accept=".csv,.xlsx" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

#### 2. Schema Mapping UI (6-8 hours)

**Create**: `apps/web-dashboard/src/components/coach/SchemaMappingUI.tsx`
```typescript
export function SchemaMappingUI({ parsedData, onMapped }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleAIMapping = async () => {
    const response = await fetch('/api/csv/map-schema', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ columns: parsedData.columns })
    });

    const aiMapping = await response.json();
    setMapping(aiMapping.mapping);
  };

  return (
    <div>
      <button onClick={handleAIMapping}>AI Auto-Map</button>
      <table>
        {parsedData.columns.map(col => (
          <tr key={col}>
            <td>{col}</td>
            <td>
              <select value={mapping[col]} onChange={e => setMapping({...mapping, [col]: e.target.value})}>
                <option value="exercise_name">Exercise Name</option>
                <option value="sets">Sets</option>
                <option value="reps">Reps</option>
                {/* ... */}
              </select>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

#### 3. Program Preview (4-6 hours)

**Create**: `apps/web-dashboard/src/components/coach/ProgramPreview.tsx`
```typescript
export function ProgramPreview({ mappedData }: Props) {
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    fetch('/api/csv/review', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ data: mappedData })
    })
    .then(res => res.json())
    .then(setReview);
  }, [mappedData]);

  return (
    <div>
      <h2>Program Quality: {review?.quality_score}/100</h2>
      <ul>
        {review?.issues.map(issue => (
          <li key={issue.id}>{issue.description}</li>
        ))}
      </ul>
      <table>
        {/* Preview program structure */}
      </table>
    </div>
  );
}
```

#### 4. Bulk Client Assignment (4-6 hours)

**Create**: `apps/web-dashboard/src/components/coach/BulkClientAssignment.tsx`
```typescript
export function BulkClientAssignment({ programId }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const handleAssign = async () => {
    await fetch('/api/csv/import', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        program_id: programId,
        client_ids: selected,
        coach_id: user.id
      })
    });

    Alert.success('Program assigned to clients');
  };

  return (
    <div>
      <ClientList clients={clients} selected={selected} onSelect={setSelected} />
      <button onClick={handleAssign}>Assign to {selected.length} clients</button>
    </div>
  );
}
```

**Deliverable**: ✅ Functional B2B coach dashboard

---

## Phase 6: Testing & Polish (2-3 days, 12-18 hours)

### End-to-End Testing

#### 1. OAuth Flow Testing (3-4 hours)

**Test Cases**:
- ✅ WHOOP OAuth: Connect device, fetch recovery data
- ✅ Terra OAuth: Connect Garmin, fetch activity data
- ✅ Stryd OAuth: Connect pod, fetch power data
- ✅ OAuth callback handling in React Native
- ✅ Token refresh on expiry

#### 2. Webhook Testing (2-3 hours)

**Test Cases**:
- ✅ WHOOP webhook: Receive recovery update
- ✅ Terra webhook: Receive activity data
- ✅ Stryd webhook: Receive power data
- ✅ Signature verification
- ✅ Duplicate event handling

#### 3. Data Flow Testing (3-4 hours)

**Critical Flows**:
- ✅ Voice workout logging → WatermelonDB → Supabase
- ✅ Program generation → RAG → Grok → Supabase
- ✅ Wearable data → Normalization → daily_metrics
- ✅ AI Health Intelligence → Correlations → Insights

#### 4. UI/UX Polish (4-7 hours)

**Enhancements**:
- ✅ Add skeleton loaders to all screens
- ✅ Improve error messages (user-friendly)
- ✅ Add success toasts for actions
- ✅ Optimize images (progressive loading)
- ✅ Add pull-to-refresh on data screens

**Deliverable**: ✅ Tested, polished, production-ready app

---

## Investor-Ready MVP Checklist

### Core Functionality (Must Have)

- [ ] **Voice Workout Logging** - Flagship feature working flawlessly
- [ ] **AI Coach Chat** - Intelligent responses with RAG
- [ ] **Program Generation** - Strength, running, hybrid programs
- [ ] **Wearable Integration** - WHOOP, Terra (Garmin/Fitbit/Oura), Stryd
- [ ] **AI Health Intelligence** - Correlations, injury risk, readiness
- [ ] **B2B Coach Dashboard** - CSV import, bulk assignment
- [ ] **Authentication** - Secure, email verification, password reset
- [ ] **Mobile App** - iOS/Android with offline support

### Investor Demo Scenarios

#### Scenario 1: Voice-First Experience (2 min)
1. Open app → Voice FAB
2. Say: "Bench press 225 for 8 reps"
3. Show instant parsing, exercise matching
4. Display workout log with AI feedback
5. **Wow Factor**: Speed, accuracy, natural language

#### Scenario 2: AI Coaching (3 min)
1. Open Chat screen
2. Ask: "Should I train today or rest?"
3. Show AI analyzing: sleep, recovery, training load
4. Display personalized recommendation
5. **Wow Factor**: Contextual intelligence, wearable integration

#### Scenario 3: Program Generation (3 min)
1. Complete onboarding questionnaire
2. Generate 12-week strength program
3. Show periodization, exercise selection
4. Display weekly schedule
5. **Wow Factor**: Instant, personalized, science-based

#### Scenario 4: Wearable Integration (2 min)
1. Connect WHOOP device
2. Show recovery score, HRV, sleep
3. Display AI insights: "Your HRV is low, consider light training"
4. **Wow Factor**: Multi-device support, actionable insights

#### Scenario 5: B2B Value (3 min)
1. Coach uploads Excel with 50 client programs
2. AI maps schema automatically
3. Review program quality (95/100)
4. Bulk assign to clients
5. **Wow Factor**: Scalability, time savings

**Total Demo**: 13 minutes covering all key features

### Metrics to Showcase

**Technical Metrics**:
- 129 API endpoints
- 45+ database tables
- 11 external API integrations
- 50+ Python services
- 32 mobile screens
- Offline-first architecture

**Business Metrics** (if available):
- User retention rate
- Average session duration
- Voice logging accuracy
- Program completion rate
- Coach time savings (B2B)

---

## Effort Summary: Investor-Ready MVP

| Phase | Focus | Days | Hours | Priority |
|-------|-------|------|-------|----------|
| **Phase 0** | Emergency Fixes | 1-2 | 8-12 | 🔴 CRITICAL |
| **Phase 1** | Security & Stability | 2-3 | 12-16 | 🔴 CRITICAL |
| **Phase 2** | UI/UX Completeness | 3-4 | 20-28 | 🟠 HIGH |
| **Phase 3** | Feature Integration | 4-5 | 28-36 | 🟠 HIGH |
| **Phase 4** | Backend Completeness | 3-4 | 20-26 | 🟡 MEDIUM |
| **Phase 5** | Web Dashboard (B2B) | 3-4 | 18-24 | 🟡 MEDIUM |
| **Phase 6** | Testing & Polish | 2-3 | 12-18 | 🟢 IMPORTANT |
| **TOTAL** | | **18-25 days** | **118-160 hours** | |

### Minimum Viable for Fundraising

**Phases 0-3 Only**: 10-14 days, 68-92 hours
- ✅ Core features working
- ✅ Secure authentication
- ✅ Professional UI
- ✅ All features accessible
- ⚠️ B2B dashboard deferred
- ⚠️ Some polish deferred

### Recommended for Strong Impression

**Phases 0-5**: 16-21 days, 106-134 hours
- ✅ Everything in Minimum Viable
- ✅ B2B coach dashboard
- ✅ Complete backend
- ⚠️ Final polish deferred

### Ideal Investor-Ready

**All Phases**: 18-25 days, 118-160 hours
- ✅ Everything polished
- ✅ Thoroughly tested
- ✅ Production-ready
- ✅ Demo-ready

---

## Risk Mitigation

### High-Risk Items (Will Cause Demo Failures)

1. **Authentication Broken** → Fix in Phase 0 (4-5 hours)
2. **Missing Critical Endpoints** → Fix in Phase 0 (3-4 hours)
3. **OAuth Not Working** → Test in Phase 6 (3-4 hours)
4. **Voice Parsing Fails** → Already working, just test

### Medium-Risk Items (Degraded Experience)

1. **UI/UX Issues** → Fix in Phase 2 (20-28 hours)
2. **Missing Error Handling** → Fix in Phase 1 (included)
3. **Slow Performance** → Optimize in Phase 6 (included)

### Low-Risk Items (Can Defer)

1. **RAG Knowledge Base** → Use existing 41 namespaces
2. **Advanced UI Features** → Food search, barcode scanner
3. **Live Activity** → Requires native Swift (defer)

---

## Next Immediate Actions (Start Today)

### Day 1 Morning (4 hours)
1. ✅ Fix `REQUIRE_AUTH` default to "true" (5 min)
2. ✅ Fix `AsyncStorage` in auth.store (10 min)
3. ✅ Implement missing `/api/chat` endpoint (1 hour)
4. ✅ Implement missing `/api/coach/clients` endpoint (1 hour)
5. ✅ Implement missing `/api/workouts/{userId}` endpoint (1 hour)
6. ✅ Fix CSV endpoint parameter mismatches (30 min)

### Day 1 Afternoon (4 hours)
7. ✅ Create centralized API client (1 hour)
8. ✅ Fix auth headers in 13 mobile components (3 hours)

### Day 2 (8 hours)
9. ✅ Apply database migrations (30 min)
10. ✅ Create missing database tables (2-3 hours)
11. ✅ Implement password reset flow (2-3 hours)
12. ✅ Add route protection (3-4 hours)

**After Day 2**: All critical blockers resolved, app functional

---

## Success Criteria

### Week 1 Complete (Phase 0-1)
- ✅ Authentication works correctly
- ✅ All critical endpoints exist
- ✅ Security vulnerabilities fixed
- ✅ App doesn't crash

### Week 2 Complete (Phase 2-3)
- ✅ Professional UI with proper feedback
- ✅ All features accessible from navigation
- ✅ Wearable data displayed
- ✅ AI insights visible

### Week 3 Complete (Phase 4-5)
- ✅ Complete backend implementation
- ✅ B2B coach dashboard working
- ✅ Data normalization complete
- ✅ Webhooks secure

### Week 4 Complete (Phase 6)
- ✅ All features tested end-to-end
- ✅ OAuth flows working with real devices
- ✅ UI polished and responsive
- ✅ Ready for investor demos

---

## Conclusion

**Current State**: 45-50% complete (revised from 60-70%)

**External Audit Impact**: Identified 28 critical/high issues we missed

**Path to MVP**:
- **Fast Track** (10-14 days): Core features + security
- **Recommended** (16-21 days): + B2B dashboard
- **Ideal** (18-25 days): Fully polished

**Key Insight**: External audit revealed authentication and security issues that would have caused complete failure in investor demos. These MUST be fixed first.

**Recommended Approach**:
1. Start with Phase 0 (emergency fixes) - 1-2 days
2. Complete Phase 1 (security) - 2-3 days
3. Tackle Phase 2-3 (UI + integration) - 7-9 days
4. Evaluate: Can we demo now? Or continue to Phase 4-6?

**Next Step**: Begin Phase 0 emergency fixes immediately

