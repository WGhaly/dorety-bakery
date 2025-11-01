#!/bin/bash

# Dorety Bakery E2E Test Runner
# Comprehensive end-to-end testing with proper setup and teardown

set -e

echo "🧪 Starting Dorety Bakery E2E Test Suite"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

print_status "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Install Playwright if not already installed
print_status "Checking Playwright installation..."
if ! npx playwright --version &> /dev/null; then
    print_status "Installing Playwright..."
    npx playwright install
fi

# Check if development server is already running
print_status "Checking if development server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Development server is already running"
    SERVER_RUNNING=true
else
    print_status "Starting development server..."
    npm run dev &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            print_success "Development server started successfully"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Development server failed to start within 30 seconds"
            if [ ! -z "$SERVER_PID" ]; then
                kill $SERVER_PID 2>/dev/null || true
            fi
            exit 1
        fi
        sleep 1
    done
fi

# Function to run test suite with error handling
run_test_suite() {
    local test_name=$1
    local test_pattern=$2
    
    print_status "Running $test_name tests..."
    
    if npx playwright test "$test_pattern" --reporter=list; then
        print_success "$test_name tests passed ✅"
        return 0
    else
        print_error "$test_name tests failed ❌"
        return 1
    fi
}

# Test execution
TEST_FAILURES=0

print_status "🚀 Starting E2E Test Execution"
echo "================================="

# Run individual test suites
run_test_suite "Navigation" "navigation.spec.ts" || ((TEST_FAILURES++))
echo ""

run_test_suite "Authentication" "authentication.spec.ts" || ((TEST_FAILURES++))
echo ""

run_test_suite "Products Page" "products.spec.ts" || ((TEST_FAILURES++))
echo ""

run_test_suite "Product Detail" "product-detail.spec.ts" || ((TEST_FAILURES++))
echo ""

# Run all tests together for comprehensive validation
print_status "Running comprehensive test suite..."
if npx playwright test --reporter=html; then
    print_success "Comprehensive test suite completed ✅"
else
    print_error "Some tests in comprehensive suite failed ❌"
    ((TEST_FAILURES++))
fi

# Generate test report
print_status "Generating test report..."
npx playwright show-report --host localhost --port 9323 &
REPORT_PID=$!

print_success "Test report available at: http://localhost:9323"

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill report server
    if [ ! -z "$REPORT_PID" ]; then
        kill $REPORT_PID 2>/dev/null || true
    fi
    
    # Kill development server if we started it
    if [ "$SERVER_RUNNING" = false ] && [ ! -z "$SERVER_PID" ]; then
        print_status "Stopping development server..."
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

# Final results
echo ""
echo "======================================="
print_status "📊 Test Execution Summary"
echo "======================================="

if [ $TEST_FAILURES -eq 0 ]; then
    print_success "🎉 All test suites passed! Your application is working correctly."
    echo ""
    print_status "✅ Navigation tests: PASSED"
    print_status "✅ Authentication tests: PASSED"  
    print_status "✅ Products page tests: PASSED"
    print_status "✅ Product detail tests: PASSED"
    echo ""
    print_success "🚀 Your Dorety Bakery application is ready for users!"
    exit 0
else
    print_error "❌ $TEST_FAILURES test suite(s) failed"
    echo ""
    print_error "Please review the test output above and fix the failing tests."
    print_status "💡 Common issues to check:"
    print_status "   - Server running on correct port (3000)"
    print_status "   - Database connections working"
    print_status "   - All required components rendering"
    print_status "   - Network requests completing successfully"
    echo ""
    print_status "📋 Test report: http://localhost:9323"
    exit 1
fi