# Static Analysis Report

## Commands for Future Use

### TypeScript Type Checking
```bash
cd apps/mobile && npx tsc --noEmit
```
This checks all TypeScript files for type errors without emitting any output files.

### ESLint (Not Currently Configured)
ESLint is not currently configured for this project. To add it, you would need to:
1. Install ESLint and plugins: `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
2. Create an `eslint.config.js` or `.eslintrc.js` file with your rules

---

## TypeScript Analysis Results

**Total Errors: 908 errors across 115 files**

### Critical Runtime Errors (Fix These First)

#### 1. **ScalePressable Component - Missing `tokens.animation.scale.pressed`**
- **File**: `src/components/common/ScalePressable.tsx:24`
- **Error**: `Cannot read property 'scale' of undefined`
- **Impact**: This is causing the runtime crash you're seeing
- **Fix**: Add the missing animation tokens or use a hardcoded value

#### 2. **Token System Issues**
- Missing `tokens.colors.badge` (used in theme)
- Missing `tokens.colors.accent.primary`, `.success`, `.warning`, `.error`, `.info`
- Missing `tokens.borders.primary` (already fixed in HomeScreen)

#### 3. **Workout Model Property Mismatches**
- `WorkoutLog` model missing: `workoutType`, `durationMinutes`
- `Set` model missing: `setNumber`
- Multiple test files trying to access non-existent properties

### Test File Issues (24 files with errors)

#### ActiveInjuryBanner Tests
- **24 test cases** missing required `onInjuryPress` prop
- All tests in `__tests__/components/ActiveInjuryBanner.test.tsx` need updating

#### Integration Tests
- Supabase type mismatches in test environment setup
- WatermelonDB model property mismatches in sync workflow tests

### Model/Database Issues

#### WatermelonDB Models with Type Errors:
1. **InjuryLog** - 13 errors
2. **Message** - 10 errors  
3. **PRHistory** - 13 errors
4. **Program** - 16 errors
5. **ReadinessScore** - 15 errors
6. **Run** - 19 errors
7. **ScheduledWorkout** - 22 errors
8. **Set** - 13 errors
9. **WorkoutLog** - 26 errors
10. **WorkoutTemplate** - 15 errors

### Service Layer Issues

#### SyncService (124 errors)
- Extensive type mismatches when syncing data between local and remote
- Properties accessed on `never` type (likely due to incorrect type guards)

#### Other Services:
- **InjuryDetectionService**: 22 errors
- **RunAnalyticsService**: 10 errors
- **CalendarService**: 7 errors
- **ExerciseSubstitutionService**: 6 errors

### Component Issues

#### Major Components:
- **WorkoutAdjustmentModal**: 109 errors (most in codebase)
- **ActiveInjuryBanner**: 44 errors
- **DeloadCard**: 23 errors
- **RecoveryDetailScreen**: 13 errors
- **AnalyticsScreen**: 12 errors

### Unused Variable Warnings (Low Priority)
- 50+ instances of declared but unused variables
- Mostly in test files and can be cleaned up later

---

## Recommended Fix Priority

### 🔴 **CRITICAL - Fix Immediately**
1. Fix `ScalePressable` animation token issue (causing runtime crash)
2. Add missing color tokens (primary, success, warning, error, info)
3. Fix `tokens.colors.badge` reference

### 🟡 **HIGH - Fix Soon**  
4. Update `ActiveInjuryBanner` component and all 24 test cases
5. Fix WatermelonDB model type definitions
6. Fix SyncService type issues (124 errors)

### 🟢 **MEDIUM - Fix When Convenient**
7. Fix remaining component type errors
8. Update integration test type mismatches
9. Clean up unused variables

### ⚪ **LOW - Nice to Have**
10. Set up ESLint configuration
11. Add stricter TypeScript compiler options
12. Remove all unused imports and variables

---

## Next Steps

1. **Run type check before every build**: `cd apps/mobile && npx tsc --noEmit`
2. **Fix the immediate runtime crash** by addressing the ScalePressable token issue
3. **Work through errors systematically** starting with the critical section above
4. **Consider adding a pre-commit hook** to run type checking automatically

