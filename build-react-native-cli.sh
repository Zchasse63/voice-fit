#!/bin/bash

cd /Users/zach/Desktop/Voice\ Fit/apps/mobile

echo "=== Building with React Native CLI (bypassing Expo device selection) ==="
echo ""

# Start Metro bundler in background
echo "Starting Metro bundler..."
npx react-native start --reset-cache &
METRO_PID=$!
echo "Metro PID: $METRO_PID"

# Wait for Metro to start
sleep 5

echo ""
echo "Building and running on iOS simulator..."
npx react-native run-ios --simulator "iPhone 16 Pro Dev"

# Keep Metro running
echo ""
echo "Metro bundler is running (PID: $METRO_PID)"
echo "Press Ctrl+C to stop"
wait $METRO_PID

