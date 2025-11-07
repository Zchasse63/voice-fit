#!/bin/bash

echo "=== Fixing Xcode Command Line Tools ==="
echo ""

echo "Step 1: Remove existing Command Line Tools..."
sudo rm -rf /Library/Developer/CommandLineTools
echo "✓ Removed"

echo ""
echo "Step 2: Reinstall Command Line Tools..."
echo "This will open a dialog - click Install"
xcode-select --install

echo ""
echo "After installation completes, run:"
echo "sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
echo ""
echo "Then verify with:"
echo "xcodebuild -version"
echo "xcrun simctl list devices"

