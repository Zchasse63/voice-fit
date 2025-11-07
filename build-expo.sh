#!/bin/bash

# New simulator UDID from Phase 3
DEVICE_UDID="6C2009C6-2B77-4B84-B83C-A10ACF1823E7"

echo "=== Phase 4: Clean Expo Build Environment ==="
cd apps/mobile

echo "Removing old build artifacts..."
rm -rf ios node_modules .expo
echo "✓ Removed ios, node_modules, .expo"

echo ""
echo "Installing dependencies..."
npm install
echo "✓ npm install complete"

echo ""
echo "Running expo prebuild --clean..."
npx expo prebuild --clean --platform ios
echo "✓ expo prebuild complete"

echo ""
echo "=== Applying Automatic Fixes ==="

# Fix 1: Comment out ReactAppDependencyProvider in Expo.podspec
echo "Fixing ReactAppDependencyProvider in node_modules/expo/Expo.podspec..."
sed -i '' 's/s.dependency '\''ReactAppDependencyProvider'\''/# s.dependency '\''ReactAppDependencyProvider'\'' # Commented out - not available in RN 0.75.4/' node_modules/expo/Expo.podspec
echo "✓ Fixed Expo.podspec"

# Fix 2: Add simdjson pod to Podfile
echo "Adding simdjson pod to ios/Podfile..."
if ! grep -q "pod 'simdjson'" ios/Podfile; then
    # Find the line with "use_expo_modules!" and add simdjson after it
    sed -i '' "/use_expo_modules!/a\\
\\
  # WatermelonDB dependency - use vendored simdjson\\
  pod 'simdjson', :path => '../node_modules/@nozbe/simdjson'
" ios/Podfile
    echo "✓ Added simdjson to Podfile"
else
    echo "✓ simdjson already in Podfile"
fi

echo ""
echo "Installing CocoaPods..."
cd ios
pod install
cd ..
echo "✓ CocoaPods installed"

echo ""
echo "=== Phase 5: Build with Explicit Device ==="
echo "Building for device: $DEVICE_UDID"
npx expo run:ios --device "$DEVICE_UDID"

