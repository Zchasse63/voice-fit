# Complete VoiceFit Expansion Task Breakdown

**Purpose**: This document lists ALL 150+ tasks that need to be completed for P0-P7, based on the implementation audit.

**Status Key**:
- ✅ COMPLETE - Work done and verified
- 🔄 IN PROGRESS - Currently being worked on
- ⏸️ PARTIAL - Some work done, needs completion
- ❌ NOT STARTED - No work done yet

---

## COMPLETED WORK (What's Already Done)

### ✅ AI Model Corrections (6 tasks)
1. ✅ Fix ScheduleOptimizationService AI model (line 28)
2. ✅ Fix HealthIntelligenceService AI model (line 34)
3. ✅ Fix PersonalizationService AI model (line 25)
4. ✅ Fix WarmupCooldownService AI model (line 27)
5. ✅ Fix CSVImportService AI model (line 29)
6. ✅ Fix VoiceSessionService AI model (line 29)

### ✅ Backend Integration (9 tasks)
7. ✅ Add service imports to main.py
8. ✅ Add global service variables to main.py
9. ✅ Create dependency injection functions (7 services)
10. ✅ Add wearables endpoints (4 endpoints)
11. ✅ Add personalization endpoints (3 endpoints)
12. ✅ Add warmup/cooldown endpoints (4 endpoints)
13. ✅ Add CSV import endpoints (5 endpoints)
14. ✅ Add voice session endpoints (5 endpoints)
15. ✅ Integrate session_id into existing endpoints (backward compatible)

### ✅ Test Files Created (4 tasks)
16. ✅ Create test_schedule_optimization.py
17. ✅ Create test_health_intelligence.py
18. ✅ Create test_personalization.py
19. ✅ Create test_warmup_cooldown.py

### ✅ Database Migrations (7 tasks)
20. ✅ Create advanced_calendar_features.sql migration
21. ✅ Create wearables_nutrition_ingestion.sql migration
22. ✅ Create user_preferences.sql migration
23. ✅ Create multi_sport_warmup_cooldown.sql migration
24. ✅ Create enterprise_dashboard.sql migration
25. ✅ Create voice_sessions.sql migration
26. ✅ Create backend services (6 services)

### ✅ Backend Services Created (6 tasks)
27. ✅ ScheduleOptimizationService (370 lines)
28. ✅ WearablesIngestionService (246 lines)
29. ✅ HealthIntelligenceService (388 lines)
30. ✅ PersonalizationService (220 lines)
31. ✅ WarmupCooldownService (373 lines)
32. ✅ CSVImportService (246 lines)
33. ✅ VoiceSessionService (271 lines)

**TOTAL COMPLETED: 33 tasks**

---

## REMAINING WORK (What Still Needs to Be Done)

### 🔄 Testing Infrastructure (4 tasks remaining)
34. 🔄 Create test_csv_import.py (IN PROGRESS)
35. ❌ Create test_voice_session.py
36. ❌ Create test_wearables_ingestion.py
37. ❌ Run full test suite (pytest, verify >80% coverage)

### P0 - Advanced Calendar Features (8 tasks)
38. ❌ Review design spec (Zed/ADVANCED_CALENDAR_SPEC.md)
39. ❌ iOS Calendar - Add drag-and-drop to CalendarView.tsx
40. ❌ iOS Calendar - Create ConflictIndicator.tsx component
41. ❌ iOS Calendar - Create TravelModeToggle.tsx component
42. ❌ iOS Calendar - Integrate all features into CalendarView
43. ❌ iOS Calendar - Update WatermelonDB models for new fields
44. ❌ iOS Calendar - Test offline sync
45. ❌ Analytics alignment - Update adherence/volume tracking for travel mode

### P1 - Wearables Integration (10 tasks)
46. ❌ Terra - Add webhook endpoint to main.py
47. ❌ Terra - Implement webhook signature verification
48. ❌ WHOOP - Add webhook/polling endpoint to main.py
49. ❌ WHOOP - Implement OAuth flow
50. ❌ WHOOP - Implement token refresh logic
51. ❌ Garmin - Create garmin_adapter.py stub
52. ❌ Apple Health - Create apple_health_adapter.py stub
53. ❌ Oura - Create oura_adapter.py stub
54. ❌ UserContextBuilder - Add tests for metric/nutrition context
55. ❌ Mobile - Create wearables connection UI

### P2 - AI Health Intelligence (10 tasks)
56. ❌ Create health snapshot design doc (Zed/HEALTH_SNAPSHOT_DESIGN.md)
57. ❌ Validate health intelligence prompts
58. ❌ Verify medical disclaimer guardrails
59. ❌ Create background job for daily insights
60. ❌ Add rate limiting for health endpoints
61. ❌ Add caching layer for health insights
62. ❌ Update chat_classifier.py for health queries
63. ❌ Update ai_coach_service.py routing to HealthIntelligenceService
64. ❌ Create HealthInsightsCard.tsx mobile component
65. ❌ Implement system message injection for daily insights

### P3 - Advanced Personalization (6 tasks)
66. ❌ Create personalization design doc (Zed/PERSONALIZATION_DESIGN.md)
67. ❌ Add tests for UserContextBuilder preferences
68. ❌ Update ProgramGenerationService to use preferences
69. ❌ Integrate personalization_service.py with chat endpoints
70. ❌ Create PreferencesScreen.tsx mobile UI
71. ❌ Test preference capture from chat

### P4 - Multi-Sport & Warmup/Cooldown (8 tasks)
72. ❌ Create multi-sport design doc (Zed/MULTI_SPORT_DESIGN.md)
73. ❌ Integrate warmup/cooldown into program generation
74. ❌ Integrate warmup/cooldown into scheduling
75. ❌ Update ProgramGenerationService for multi-sport
76. ❌ Create SportSelector.tsx mobile component
77. ❌ Create WarmupCooldownSection.tsx mobile component
78. ❌ Update WorkoutDetailScreen.tsx to show warmup/cooldown
79. ❌ Update WatermelonDB models for multi-sport

### P5 - Unified Dashboard (68 tasks)

#### P5.1 - Database & Authorization (5 tasks)
80. ❌ Create coach_client_invitations table migration
81. ❌ Update client_assignments table (add revoked_at, revoked_by)
82. ❌ Update user_profiles table (add user_type column)
83. ❌ Create RLS policies for coach→client data access
84. ❌ Create invitation API endpoints (5 endpoints)

#### P5.2 - Web Dashboard Shared Components (6 tasks)
85. ❌ Create AIChat.tsx component (accepts userId/clientId)
86. ❌ Create Analytics.tsx component (accepts userId/clientId)
87. ❌ Create Calendar.tsx component (accepts userId/clientId)
88. ❌ Create HealthInsights.tsx component
89. ❌ Create ProgramBuilder.tsx component
90. ❌ Create DashboardLayout.tsx (detects user type)

#### P5.3 - Premium User Dashboard (4 tasks)
91. ❌ Create premium user routes (/dashboard/*)
92. ❌ Implement premium user authentication
93. ❌ Wire shared components to own data
94. ❌ Create premium dashboard API endpoints

#### P5.4 - Coach Dashboard (8 tasks)
95. ❌ Create ClientSelector.tsx component
96. ❌ Create ClientList page
97. ❌ Create coach routes (/coach/clients/*)
98. ❌ Implement coach authentication
99. ❌ Wire shared components to selected client data
100. ❌ Create InviteClient.tsx UI
101. ❌ Create TeamManagement.tsx UI
102. ❌ Create coach API endpoints (5 endpoints)

#### P5.5 - CSV Import UI (2 tasks)
103. ❌ Create CSVImport.tsx component
104. ❌ Wire CSV endpoints to UI

#### P5.6 - Next.js Infrastructure (11 tasks)
105. ❌ Create next.config.js
106. ❌ Create tsconfig.json
107. ❌ Create tailwind.config.js
108. ❌ Create postcss.config.js
109. ❌ Create .env.example
110. ❌ Create app directory structure
111. ❌ Create app/layout.tsx (root layout)
112. ❌ Create app/page.tsx (home page)
113. ❌ Create auth pages (login, signup)
114. ❌ Create Supabase client utilities
115. ❌ Create UI component library (button, input, modal, etc.)

#### P5.7 - iOS Coach Features (8 tasks)
116. ❌ Create ClientSelectorScreen.tsx
117. ❌ Create ClientSelectorHeader.tsx
118. ❌ Create InviteClientScreen.tsx
119. ❌ Create coach.store.ts (Zustand)
120. ❌ Update ChatScreen for coaches (accept clientId)
121. ❌ Update CalendarScreen for coaches (accept clientId)
122. ❌ Update AnalyticsScreen for coaches (accept clientId)
123. ❌ Add client selector to navigation

### P6 - Voice-First UX & Sessions (6 tasks)
124. ❌ Create session model design doc
125. ❌ Implement session timeout handling
126. ❌ Update chat_classifier.py for off-topic detection
127. ❌ Update personality_engine.py for humor
128. ❌ Update ChatScreen.tsx to show session state
129. ❌ Update VoiceService.ts to pass session_id

### P7 - Live Activity (8 tasks)
130. ❌ Review existing Live Activity implementation
131. ❌ Create WorkoutActivityAttributes.swift
132. ❌ Create WorkoutLiveActivity.swift
133. ❌ Configure Live Activity capability in Xcode
134. ❌ Create LiveActivityModule.swift (native bridge)
135. ❌ Create LiveActivityService.ts (TypeScript)
136. ❌ Integrate with workout store
137. ❌ QA & compliance testing on device

---

## SUMMARY

- **Total Tasks**: 137
- **Completed**: 33 (24%)
- **In Progress**: 1 (1%)
- **Remaining**: 103 (75%)

**Estimated Remaining Time**: 8-12 weeks (1 developer)

**Next Immediate Tasks**:
1. Finish test_csv_import.py (IN PROGRESS)
2. Create test_voice_session.py
3. Create test_wearables_ingestion.py
4. Run full test suite
5. Begin P5.1 database migrations for unified dashboard

