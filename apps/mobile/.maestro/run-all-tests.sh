#!/bin/bash

# Maestro Test Suite Runner for VoiceFit Mobile App
# This script runs all Maestro E2E tests for the iOS app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0
FAILED_TESTS=()

# Configuration
APP_ID="com.voicefit.app"
MAESTRO_DIR="$(dirname "$0")"
DEVICE_ID="${MAESTRO_DEVICE_ID:-}" # Optional: set specific device

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   VoiceFit Mobile - Maestro Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}Error: Maestro is not installed${NC}"
    echo "Install it with: curl -Ls \"https://get.maestro.mobile.dev\" | bash"
    exit 1
fi

# Check if iOS Simulator is running (if not using device)
if [ -z "$DEVICE_ID" ]; then
    if ! xcrun simctl list | grep -q "Booted"; then
        echo -e "${YELLOW}Warning: No iOS Simulator appears to be running${NC}"
        echo "Start the simulator before running tests"
        exit 1
    fi
fi

# Function to run a single test
run_test() {
    local test_file=$1
    local test_name=$(basename "$test_file" .yaml)

    TOTAL=$((TOTAL + 1))
    echo -e "${BLUE}Running test ${TOTAL}: ${test_name}${NC}"

    if [ -n "$DEVICE_ID" ]; then
        if maestro test --device "$DEVICE_ID" "$test_file"; then
            echo -e "${GREEN}✓ PASSED: ${test_name}${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED: ${test_name}${NC}"
            FAILED=$((FAILED + 1))
            FAILED_TESTS+=("$test_name")
        fi
    else
        if maestro test "$test_file"; then
            echo -e "${GREEN}✓ PASSED: ${test_name}${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED: ${test_name}${NC}"
            FAILED=$((FAILED + 1))
            FAILED_TESTS+=("$test_name")
        fi
    fi

    echo ""
}

# Function to print test summary
print_summary() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}   Test Summary${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo -e "Total Tests:  ${TOTAL}"
    echo -e "${GREEN}Passed:       ${PASSED}${NC}"
    echo -e "${RED}Failed:       ${FAILED}${NC}"

    if [ $FAILED -gt 0 ]; then
        echo ""
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "  ${RED}✗ ${test}${NC}"
        done
    fi

    echo -e "${BLUE}================================================${NC}"

    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! 🎉${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed 😞${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-all}" in
    all)
        echo "Running all test flows..."
        echo ""

        # Run tests in order
        run_test "$MAESTRO_DIR/00-onboarding.yaml"
        run_test "$MAESTRO_DIR/01-login.yaml"
        run_test "$MAESTRO_DIR/02-ai-coach.yaml"
        run_test "$MAESTRO_DIR/03-workout-tracking.yaml"
        run_test "$MAESTRO_DIR/04-voice-interaction.yaml"
        run_test "$MAESTRO_DIR/05-profile-settings.yaml"
        run_test "$MAESTRO_DIR/06-error-handling.yaml"
        run_test "$MAESTRO_DIR/07-navigation.yaml"
        run_test "$MAESTRO_DIR/08-workout-programs.yaml"

        print_summary
        ;;

    smoke)
        echo "Running smoke tests (core functionality only)..."
        echo ""

        run_test "$MAESTRO_DIR/01-login.yaml"
        run_test "$MAESTRO_DIR/02-ai-coach.yaml"
        run_test "$MAESTRO_DIR/03-workout-tracking.yaml"

        print_summary
        ;;

    login)
        run_test "$MAESTRO_DIR/01-login.yaml"
        print_summary
        ;;

    coach)
        run_test "$MAESTRO_DIR/02-ai-coach.yaml"
        print_summary
        ;;

    workout)
        run_test "$MAESTRO_DIR/03-workout-tracking.yaml"
        print_summary
        ;;

    voice)
        run_test "$MAESTRO_DIR/04-voice-interaction.yaml"
        print_summary
        ;;

    profile)
        run_test "$MAESTRO_DIR/05-profile-settings.yaml"
        print_summary
        ;;

    errors)
        run_test "$MAESTRO_DIR/06-error-handling.yaml"
        print_summary
        ;;

    navigation)
        run_test "$MAESTRO_DIR/07-navigation.yaml"
        print_summary
        ;;

    programs)
        run_test "$MAESTRO_DIR/08-workout-programs.yaml"
        print_summary
        ;;

    *)
        echo "Usage: $0 [test-name]"
        echo ""
        echo "Available options:"
        echo "  all         - Run all tests (default)"
        echo "  smoke       - Run smoke tests (core flows only)"
        echo "  login       - Run login test"
        echo "  coach       - Run AI coach test"
        echo "  workout     - Run workout tracking test"
        echo "  voice       - Run voice interaction test"
        echo "  profile     - Run profile/settings test"
        echo "  errors      - Run error handling test"
        echo "  navigation  - Run navigation test"
        echo "  programs    - Run workout programs test"
        echo ""
        echo "Environment variables:"
        echo "  MAESTRO_DEVICE_ID  - Specify device ID for testing"
        exit 1
        ;;
esac
