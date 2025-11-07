#!/bin/bash

cd /Users/zach/Desktop/Voice\ Fit/apps/mobile

echo "=== Regenerating iOS Project from Scratch ==="
echo ""

echo "Step 1: Removing corrupted iOS directory..."
rm -rf ios
echo "✓ Removed ios directory"

echo ""
echo "Step 2: Removing .expo cache..."
rm -rf .expo
echo "✓ Removed .expo cache"

echo ""
echo "Step 3: Running expo prebuild to regenerate iOS project..."
npx expo prebuild --clean --platform ios
echo "✓ expo prebuild complete"

echo ""
echo "Step 4: Applying fixes..."

# Fix 1: Comment out ReactAppDependencyProvider in Expo.podspec
echo "Fixing ReactAppDependencyProvider in node_modules/expo/Expo.podspec..."
sed -i '' 's/s.dependency '\''ReactAppDependencyProvider'\''/# s.dependency '\''ReactAppDependencyProvider'\'' # Commented out - not available in RN 0.75.4/' node_modules/expo/Expo.podspec
echo "✓ Fixed Expo.podspec"

# Fix 2: Add simdjson pod to Podfile
echo "Adding simdjson pod to ios/Podfile..."
if ! grep -q "pod 'simdjson'" ios/Podfile; then
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
echo "Step 5: Installing CocoaPods..."
cd ios
pod install --repo-update
cd ..
echo "✓ CocoaPods installed"

echo ""
echo "Step 6: Verifying workspace file..."
if [ -f "ios/VoiceFit.xcworkspace/contents.xcworkspacedata" ]; then
    echo "✓ Workspace file exists"
    cat ios/VoiceFit.xcworkspace/contents.xcworkspacedata
else
    echo "✗ Workspace file missing!"
    exit 1
fi

echo ""
echo "=== iOS Project Regenerated Successfully ==="
echo ""
echo "Next steps:"
echo "1. Try opening in Xcode: open ios/VoiceFit.xcworkspace"
echo "2. Or build directly: npx expo run:ios"

