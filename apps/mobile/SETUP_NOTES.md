# Voice Fit Mobile App - Setup Notes

## Current Configuration (Working as of 2025-11-05)

### ✅ Successfully Running
- **React Native**: 0.79.6 (upgraded from 0.75.4)
- **React**: 19.0.0 (upgraded from 18.3.1)
- **Expo SDK**: 53.0.23
- **iOS Simulator**: iPhone 17 Pro Max (iOS 26.1)
- **Node**: v20.19.5
- **npm**: 10.8.2

### Critical Dependencies
```json
{
  "react": "19.0.0",
  "react-native": "0.79.6",
  "expo": "~53.0.0",
  "react-native-svg": "^15.11.2",
  "@nozbe/watermelondb": "^0.27.1",
  "@react-native-voice/voice": "^3.2.4"
}
```

## Important: What NOT to Lose

### 1. Package.json Configuration
The following versions are **critical** and must not be downgraded:
- `react: "19.0.0"` - Required by Expo SDK 53
- `react-native: "0.79.6"` - Required by Expo SDK 53
- `@types/react: "~19.0.10"` - Must match React version

### 2. Podfile Configuration
The Podfile at `ios/Podfile` contains a critical WatermelonDB dependency that must be preserved:

```ruby
# WatermelonDB dependency - use vendored simdjson
pod 'simdjson', :path => '../node_modules/@nozbe/simdjson'
```

**Location**: Lines 19-20 in `ios/Podfile`

**When to restore**: After running `npx expo prebuild --clean` or if the Podfile is regenerated.

### 3. Node Modules State
The Expo files in `node_modules/expo/ios/AppDelegates/` are now in their correct state with React Native 0.79.6:
- `ExpoAppDelegate.swift` - Imports ReactAppDependencyProvider (line 4)
- `ExpoReactNativeFactory.swift` - Fully uncommented
- `ExpoReactNativeFactoryDelegate.swift` - Fully uncommented
- `Expo.podspec` - Includes ReactAppDependencyProvider dependency (line 101)

**These files should NOT need modification** as long as you're using React Native 0.79.6+.

## Common Operations

### Installing New Packages
Always use `--legacy-peer-deps` flag due to some dependencies not yet supporting React 19:

```bash
npm install <package-name> --legacy-peer-deps
```

### Running the App
```bash
# From apps/mobile directory
npx expo run:ios --device "iPhone 17 Pro Max"
```

### Rebuilding iOS
If you need to clean rebuild:

```bash
# Clean build artifacts
rm -rf ios/build
rm -rf .expo

# Rebuild
npx expo run:ios --device "iPhone 17 Pro Max"
```

### If You Run `npx expo prebuild --clean`
This will regenerate the iOS project. After running it, you MUST:

1. **Re-add simdjson to Podfile**:
   ```bash
   # Edit ios/Podfile and add after line 17 (after use_expo_modules!):
   # WatermelonDB dependency - use vendored simdjson
   pod 'simdjson', :path => '../node_modules/@nozbe/simdjson'
   ```

2. **Run pod install**:
   ```bash
   cd ios && pod install
   ```

### If You Run `npm install` (without --legacy-peer-deps)
You may encounter peer dependency conflicts. Solutions:

1. **Recommended**: Always use `--legacy-peer-deps`:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **If you accidentally ran `npm install`**: Just run it again with the flag:
   ```bash
   npm install --legacy-peer-deps
   ```

## Troubleshooting

### Black Screen on Launch
**Cause**: React Native version mismatch with Expo SDK 53

**Solution**: Verify versions in package.json:
```bash
npm list react react-native
# Should show:
# react@19.0.0
# react-native@0.79.6
```

If versions are wrong, reinstall:
```bash
npm install react@19.0.0 react-native@0.79.6 --legacy-peer-deps
cd ios && pod install
```

### Build Fails: "ReactAppDependencyProvider not found"
**Cause**: Using React Native < 0.79 or pods not installed

**Solution**:
```bash
# Verify RN version
npm list react-native
# Should be 0.79.6

# Reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Build Fails: "simdjson not found"
**Cause**: Podfile missing simdjson declaration

**Solution**: Add to `ios/Podfile` after `use_expo_modules!`:
```ruby
pod 'simdjson', :path => '../node_modules/@nozbe/simdjson'
```

Then run:
```bash
cd ios && pod install
```

### Metro Bundler Warnings: "Unable to update item 'auth-storage'"
**Status**: Expected behavior - storage not configured yet

**Impact**: None - this is a non-critical warning from zustand persist middleware

## Project Structure Notes

### Directory Renamed
The project directory was renamed from `Voice Fit` to `VoiceFit` (removed space) to prevent build issues with Xcode paths.

**Location**: `~/Desktop/VoiceFit/`

### Current Development State
- ✅ Basic navigation structure (bottom nav with 5 icons) working
- ⏳ Detailed UI styling from Figma not yet implemented
- ⏳ Voice features showing placeholder messages
- ⏳ WatermelonDB offline storage configured but not yet in use

## Key Learnings

### Why React Native 0.79.6 is Required
Expo SDK 53 explicitly requires React Native 0.79. The previous version (0.75.4) was incompatible and caused:
- Black screen on app launch
- Missing factory classes (ReactAppDependencyProvider, RCTReactNativeFactory)
- Metro bundler connection failures

### Why React 19 is Required
Expo SDK 53 requires React 19. Using React 18 will cause peer dependency conflicts and potential runtime issues.

### Why --legacy-peer-deps is Needed
Some dependencies (like `@nozbe/with-observables`) haven't updated their peer dependencies to support React 19 yet. The `--legacy-peer-deps` flag allows npm to install packages despite these conflicts.

## Backup Strategy

### Critical Files to Backup
If you need to reset the project, these files contain your custom configuration:

1. `package.json` - All dependency versions
2. `ios/Podfile` - Native iOS dependencies (especially simdjson)
3. `app.json` - Expo configuration
4. `.env` - Environment variables (Supabase keys, etc.)

### Quick Backup Command
```bash
# From apps/mobile directory
cp package.json package.json.backup
cp ios/Podfile ios/Podfile.backup
cp app.json app.json.backup
cp .env .env.backup
```

## Next Steps for Development

1. **UI Implementation**: Apply Figma design system to components
2. **Voice Features**: Implement voice recognition with @react-native-voice/voice
3. **Offline Storage**: Set up WatermelonDB schemas and sync
4. **Testing**: Set up Playwright (web) and Maestro (iOS) for E2E tests

---

**Last Updated**: 2025-11-05
**Status**: ✅ App successfully building and running on iPhone 17 Pro Max simulator

