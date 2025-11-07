#!/bin/bash

cd /Users/zach/Desktop/Voice\ Fit/apps/mobile

echo "=== Building with xcodebuild directly using simulator name ==="
echo ""

# Use simulator name instead of ID
xcodebuild \
  -workspace ios/VoiceFit.xcworkspace \
  -scheme VoiceFit \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro Dev' \
  -derivedDataPath ios/build \
  build

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Build Successful! ==="
    echo "Now installing to simulator..."
    
    # Get the app path
    APP_PATH="ios/build/Build/Products/Debug-iphonesimulator/VoiceFit.app"
    
    # Boot the simulator if not already booted
    xcrun simctl boot "iPhone 16 Pro Dev" 2>/dev/null || echo "Simulator already booted"
    
    # Install the app
    xcrun simctl install "iPhone 16 Pro Dev" "$APP_PATH"
    
    # Launch the app
    xcrun simctl launch "iPhone 16 Pro Dev" com.voicefit.app
    
    echo ""
    echo "=== App Launched! ==="
    echo "Now start Metro bundler in another terminal:"
    echo "cd /Users/zach/Desktop/Voice\ Fit/apps/mobile && npx expo start"
else
    echo ""
    echo "=== Build Failed ==="
    echo "Check the error messages above"
    exit 1
fi

