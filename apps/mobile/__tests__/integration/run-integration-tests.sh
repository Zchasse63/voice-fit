#!/bin/bash

# Integration Test Runner
# Validates environment and runs integration tests against real services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if .env exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found"
        print_info "Create .env file with required variables:"
        echo ""
        echo "  EXPO_PUBLIC_VOICE_API_URL=https://your-app.up.railway.app"
        echo "  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
        echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
        echo ""
        exit 1
    fi
    print_success ".env file found"
}

# Load environment variables
load_env() {
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    fi
}

# Check required environment variables
check_env_vars() {
    print_info "Checking environment variables..."

    local missing=()

    if [ -z "$EXPO_PUBLIC_VOICE_API_URL" ] && [ -z "$VOICE_API_URL" ]; then
        missing+=("EXPO_PUBLIC_VOICE_API_URL or VOICE_API_URL")
    fi

    if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
        missing+=("EXPO_PUBLIC_SUPABASE_URL")
    fi

    if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
        missing+=("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_info "Add these to your .env file"
        exit 1
    fi

    print_success "All required environment variables set"
}

# Check backend health
check_backend() {
    print_info "Checking backend health..."

    local backend_url="${EXPO_PUBLIC_VOICE_API_URL:-$VOICE_API_URL}"

    if [ -z "$backend_url" ]; then
        print_error "Backend URL not set"
        exit 1
    fi

    # Try to reach health endpoint
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${backend_url}/health" 2>&1 || echo "000")

    if [ "$response" = "200" ]; then
        print_success "Backend is healthy at ${backend_url}"
    else
        print_error "Backend not reachable at ${backend_url}/health"
        print_error "HTTP Status: ${response}"
        print_info "Please ensure Railway backend is deployed and running"
        exit 1
    fi
}

# Check Supabase connection
check_supabase() {
    print_info "Checking Supabase connection..."

    if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
        print_error "Supabase URL not set"
        exit 1
    fi

    # Try to reach Supabase REST API
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
        "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/" 2>&1 || echo "000")

    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        # 404 is okay - means Supabase is reachable, just no root endpoint
        print_success "Supabase is reachable at ${EXPO_PUBLIC_SUPABASE_URL}"
    else
        print_warning "Supabase connection check inconclusive (HTTP ${response})"
        print_info "Proceeding with tests - will fail if Supabase is down"
    fi
}

# Run integration tests
run_tests() {
    print_header "Running Integration Tests"

    local test_pattern="${1:-__tests__/integration}"

    print_info "Test pattern: ${test_pattern}"
    print_info "This may take a few minutes..."
    echo ""

    # Run tests with Jest
    npm test -- "$test_pattern" --verbose --runInBand

    local exit_code=$?

    echo ""
    if [ $exit_code -eq 0 ]; then
        print_success "All integration tests passed!"
    else
        print_error "Some integration tests failed"
        exit $exit_code
    fi
}

# Main execution
main() {
    print_header "VoiceFit Integration Test Runner"

    # Change to mobile app directory if not already there
    if [ ! -f "package.json" ]; then
        if [ -d "apps/mobile" ]; then
            cd apps/mobile
            print_info "Changed directory to apps/mobile"
        else
            print_error "Cannot find mobile app directory"
            exit 1
        fi
    fi

    # Step 1: Check .env file
    check_env_file

    # Step 2: Load environment variables
    load_env

    # Step 3: Check environment variables
    check_env_vars

    # Step 4: Check backend health
    check_backend

    # Step 5: Check Supabase connection
    check_supabase

    # Step 6: Run tests
    run_tests "$1"

    print_header "✨ Integration Tests Complete ✨"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [test-pattern]"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all integration tests"
    echo "  $0 workflows/voice-to-database        # Run specific test suite"
    echo "  $0 workflows/sync-workflow            # Run sync tests"
    echo ""
    echo "Environment variables required in .env:"
    echo "  EXPO_PUBLIC_VOICE_API_URL"
    echo "  EXPO_PUBLIC_SUPABASE_URL"
    echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo ""
    exit 0
fi

# Run main function
main "$1"
