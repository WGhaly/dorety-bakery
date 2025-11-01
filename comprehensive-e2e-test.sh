#!/bin/bash

# 🏪 DORETY BAKERY - COMPREHENSIVE END-TO-END BUSINESS FLOW TEST
# Tests complete customer journey + admin workflow

echo "🏪 ==============================================="
echo "🎂 DORETY BAKERY - FULL E2E BUSINESS FLOW TEST"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0

# Helper function to test HTTP responses
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -e "${BLUE}Testing:${NC} $description"
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $endpoint returned $response"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - $endpoint returned $response (expected $expected_status)"
        ((FAILED++))
    fi
    echo
}

# Helper function to test API with data
test_api_with_data() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local description="$4"
    
    echo -e "${BLUE}Testing:${NC} $description"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "HTTP_STATUS:%{http_code}" \
            "$endpoint")
    else
        response=$(curl -s -w "HTTP_STATUS:%{http_code}" "$endpoint")
    fi
    
    http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    echo "Response: $response_body" | head -c 200
    echo ""
    echo "Status: $http_status"
    
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ] || [ "$http_status" = "302" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $http_status"
        ((FAILED++))
    fi
    echo
}

echo "🚀 Starting server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

echo "⏳ Waiting for server to start..."
sleep 8

# Test if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}❌ Server failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Server is running!${NC}"
echo

# ============================================
# PHASE 1: BASIC PAGE ACCESSIBILITY
# ============================================
echo -e "${YELLOW}📋 PHASE 1: Basic Page Accessibility${NC}"
echo "============================================"

test_endpoint "http://localhost:3000" "200" "Home page"
test_endpoint "http://localhost:3000/register" "200" "Registration page"
test_endpoint "http://localhost:3000/login" "200" "Login page"
test_endpoint "http://localhost:3000/products" "200" "Products page"
test_endpoint "http://localhost:3000/admin/login" "200" "Admin login page"

# ============================================
# PHASE 2: DATABASE AND API FUNCTIONALITY
# ============================================
echo -e "${YELLOW}📋 PHASE 2: Database & API Tests${NC}"
echo "============================================"

test_endpoint "http://localhost:3000/api/products" "200" "Products API"
test_endpoint "http://localhost:3000/api/categories" "200" "Categories API"
test_endpoint "http://localhost:3000/api/banners" "200" "Banners API"

echo -e "${BLUE}Testing:${NC} Products API response structure"
products_response=$(curl -s "http://localhost:3000/api/products?limit=2")
echo "Sample products response:"
echo "$products_response" | jq '.' 2>/dev/null || echo "$products_response" | head -c 300
echo

# ============================================
# PHASE 3: CUSTOMER REGISTRATION FLOW
# ============================================
echo -e "${YELLOW}📋 PHASE 3: Customer Registration Flow${NC}"
echo "============================================"

# Generate unique test data
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@dorety.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Test User ${TIMESTAMP}"

echo "🧪 Testing customer registration..."
echo "Test email: $TEST_EMAIL"

# Test registration
registration_data="{
    \"name\": \"$TEST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
}"

test_api_with_data "http://localhost:3000/api/auth/register" "POST" "$registration_data" "Customer registration"

# ============================================
# PHASE 4: CUSTOMER LOGIN FLOW  
# ============================================
echo -e "${YELLOW}📋 PHASE 4: Customer Login Flow${NC}"
echo "============================================"

echo "🧪 Testing customer login..."

# Test login
login_data="{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
}"

test_api_with_data "http://localhost:3000/api/auth/signin" "POST" "$login_data" "Customer login"

# ============================================
# PHASE 5: SHOPPING CART FLOW
# ============================================
echo -e "${YELLOW}📋 PHASE 5: Shopping Cart Flow${NC}"
echo "============================================"

echo "🧪 Testing cart functionality..."

# Test cart access (should require auth)
test_endpoint "http://localhost:3000/api/cart" "401" "Cart API (unauthorized access)"

# Test add to cart (mock - would need session)
echo -e "${BLUE}Testing:${NC} Cart structure (authenticated)"
echo "Note: Full cart testing requires session cookies"

# ============================================
# PHASE 6: ORDER CREATION SIMULATION
# ============================================
echo -e "${YELLOW}📋 PHASE 6: Order Creation Flow${NC}"
echo "============================================"

echo "🧪 Testing order creation endpoints..."

# Test orders API
test_endpoint "http://localhost:3000/api/orders" "401" "Orders API (requires auth)"

# Test checkout process
test_endpoint "http://localhost:3000/checkout" "200" "Checkout page accessibility"

# ============================================
# PHASE 7: ADMIN LOGIN AND DASHBOARD
# ============================================
echo -e "${YELLOW}📋 PHASE 7: Admin Login & Dashboard${NC}"
echo "============================================"

echo "🧪 Testing admin login..."

# Test admin login with default credentials
admin_login_data="{
    \"email\": \"admin@dorety.com\",
    \"password\": \"admin123\"
}"

test_api_with_data "http://localhost:3000/api/auth/admin-signin" "POST" "$admin_login_data" "Admin login"

# Test admin dashboard access
test_endpoint "http://localhost:3000/admin/dashboard" "200" "Admin dashboard page"
test_endpoint "http://localhost:3000/admin/orders" "200" "Admin orders page"

# ============================================
# PHASE 8: ADMIN ORDER MANAGEMENT
# ============================================
echo -e "${YELLOW}📋 PHASE 8: Admin Order Management${NC}"
echo "============================================"

echo "🧪 Testing admin order management..."

# Test admin orders API
test_endpoint "http://localhost:3000/api/admin/orders" "401" "Admin orders API (requires admin auth)"

# Test order status updates
echo -e "${BLUE}Testing:${NC} Order status update endpoints"
echo "Note: Full order management testing requires admin session"

# ============================================
# PHASE 9: CUSTOMER ORDER TRACKING
# ============================================
echo -e "${YELLOW}📋 PHASE 9: Customer Order Tracking${NC}"
echo "============================================"

echo "🧪 Testing customer order tracking..."

# Test customer orders page
test_endpoint "http://localhost:3000/orders" "200" "Customer orders page"

# Test customer profile
test_endpoint "http://localhost:3000/profile" "200" "Customer profile page"

# ============================================
# PHASE 10: ADVANCED FEATURES
# ============================================
echo -e "${YELLOW}📋 PHASE 10: Advanced Features${NC}"
echo "============================================"

echo "🧪 Testing advanced features..."

# Test addresses management
test_endpoint "http://localhost:3000/addresses" "200" "Customer addresses page"

# Test contact page
test_endpoint "http://localhost:3000/contact" "200" "Contact page"

# Test about page
test_endpoint "http://localhost:3000/about" "200" "About page"

# ============================================
# MANUAL TESTING INSTRUCTIONS
# ============================================
echo -e "${YELLOW}📋 MANUAL TESTING REQUIRED${NC}"
echo "============================================"

echo "🔍 The following require manual browser testing:"
echo
echo "1. 🏠 HOMEPAGE:"
echo "   → Visit http://localhost:3000"
echo "   → Check banners are displaying"
echo "   → Verify navigation works"
echo
echo "2. 👤 CUSTOMER REGISTRATION:"
echo "   → Go to http://localhost:3000/register"
echo "   → Fill form with: $TEST_EMAIL / $TEST_PASSWORD"
echo "   → Verify account creation"
echo
echo "3. 🔐 CUSTOMER LOGIN:"
echo "   → Go to http://localhost:3000/login"
echo "   → Login with: $TEST_EMAIL / $TEST_PASSWORD"
echo "   → Check redirect to dashboard"
echo
echo "4. 🛒 SHOPPING FLOW:"
echo "   → Browse http://localhost:3000/products"
echo "   → Add items to cart"
echo "   → Go through checkout process"
echo "   → Complete order placement"
echo
echo "5. 👑 ADMIN WORKFLOW:"
echo "   → Login at http://localhost:3000/admin/login"
echo "   → Use: admin@dorety.com / admin123"
echo "   → Check orders in dashboard"
echo "   → Update order status"
echo
echo "6. 📦 ORDER TRACKING:"
echo "   → Login as customer"
echo "   → Check http://localhost:3000/orders"
echo "   → Verify order status updates"

# ============================================
# RESULTS SUMMARY
# ============================================
echo
echo "============================================"
echo -e "${YELLOW}🎯 TEST RESULTS SUMMARY${NC}"
echo "============================================"
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL AUTOMATED TESTS PASSED!${NC}"
    echo "Ready for manual E2E testing!"
else
    echo -e "${RED}⚠️  Some tests failed. Check issues above.${NC}"
fi

echo
echo "🖥️  Server is running at: http://localhost:3000"
echo "🔧 Server PID: $SERVER_PID"
echo "📝 To stop server: kill $SERVER_PID"
echo
echo "🎯 Next: Complete the manual testing checklist above!"