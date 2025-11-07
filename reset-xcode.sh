#!/bin/bash

echo "=== Phase 1: Complete Xcode Cache Purge ==="
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "✓ Cleared Xcode DerivedData"

rm -rf ~/Library/Caches/com.apple.dt.Xcode
echo "✓ Cleared Xcode Caches"

rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*
echo "✓ Cleared iOS DeviceSupport"

xcrun simctl erase all
echo "✓ Erased all simulators"

xcrun simctl shutdown all
echo "✓ Shutdown all simulators"

defaults delete com.apple.iphonesimulator 2>/dev/null || true
echo "✓ Cleared simulator preferences"

echo ""
echo "=== Phase 2: Reset Xcode Installation ==="
echo "Skipping sudo xcode-select --reset (requires manual password)"

xcrun simctl list devices --json > /dev/null
echo "✓ Forced device list rebuild"

echo ""
echo "=== Phase 3: List Available Runtimes ==="
xcrun simctl list runtimes

echo ""
echo "=== Available Devices After Reset ==="
xcrun simctl list devices available

echo ""
echo "=== Phase 3: Create iPhone 16 Pro Simulator ==="
# Get iOS 18.2 runtime identifier
RUNTIME=$(xcrun simctl list runtimes | grep "iOS 18.2" | awk '{print $NF}')
echo "Using runtime: $RUNTIME"

if [ -z "$RUNTIME" ]; then
    echo "ERROR: iOS 18.2 runtime not found. Available runtimes:"
    xcrun simctl list runtimes
    exit 1
fi

# Create new iPhone 16 Pro simulator
DEVICE_ID=$(xcrun simctl create "iPhone 16 Pro Dev" \
    "com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro" \
    "$RUNTIME")

echo "✓ Created iPhone 16 Pro Dev with ID: $DEVICE_ID"

# Boot the simulator
xcrun simctl boot "$DEVICE_ID"
echo "✓ Booted simulator"

echo ""
echo "=== Final Device List ==="
xcrun simctl list devices available | grep "iPhone 16 Pro"

echo ""
echo "=== SUCCESS ==="
echo "New simulator UDID: $DEVICE_ID"
echo "You can now run: npx expo run:ios --device \"$DEVICE_ID\""

