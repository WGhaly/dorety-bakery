#!/bin/bash

# Comprehensive test script that handles server startup
echo "🚀 Starting comprehensive Dorety Bakery testing..."

# Kill any existing server processes on port 3000
echo "🔍 Checking for existing servers..."
if lsof -i :3000 >/dev/null 2>&1; then
    echo "🛑 Killing existing server on port 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

cd "/Users/waseemghaly/Documents/PRG/Emad/VS Projects/Dorety Bakery Project/Fadi's Bakery App"

# Start the server in background
echo "🌟 Starting Next.js development server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    echo "   Attempt $i/30..."
    sleep 2
done

# Check if server is actually running
if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "❌ Server failed to start properly"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🧪 Running comprehensive tests..."
echo "=================================="

# Test 1: Core Pages
echo "📄 Testing core pages..."
pages=("/" "/products" "/about" "/contact" "/login" "/register")
for page in "${pages[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    if [ "$response" = "200" ]; then
        echo "   ✅ $page - OK"
    else
        echo "   ❌ $page - Failed (HTTP $response)"
    fi
done

# Test 2: API Endpoints
echo ""
echo "🔌 Testing API endpoints..."

# Products API
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/products)
http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ]; then
    product_count=$(echo "$response" | head -c -4 | jq '.products | length' 2>/dev/null || echo "unknown")
    echo "   ✅ Products API - $product_count products found"
else
    echo "   ❌ Products API - Failed (HTTP $http_code)"
fi

# Categories API
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/categories)
http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ]; then
    category_count=$(echo "$response" | head -c -4 | jq '.categories | length' 2>/dev/null || echo "unknown")
    echo "   ✅ Categories API - $category_count categories found"
else
    echo "   ❌ Categories API - Failed (HTTP $http_code)"
fi

# Banners API
response=$(curl -s -w "%{http_code}" "http://localhost:3000/api/banners?page=home&userType=ALL")
http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ]; then
    banner_count=$(echo "$response" | head -c -4 | jq '.banners | length' 2>/dev/null || echo "unknown")
    echo "   ✅ Banners API - $banner_count banners found"
else
    echo "   ❌ Banners API - Failed (HTTP $http_code)"
fi

# Test 3: Product Details
echo ""
echo "🛍️ Testing product details..."
first_product_slug=$(curl -s "http://localhost:3000/api/products?limit=1" | jq -r '.products[0].slug' 2>/dev/null || echo "")
if [ "$first_product_slug" != "" ] && [ "$first_product_slug" != "null" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/products/$first_product_slug")
    if [ "$response" = "200" ]; then
        echo "   ✅ Product detail page - OK ($first_product_slug)"
    else
        echo "   ❌ Product detail page - Failed (HTTP $response)"
    fi
else
    echo "   ⚠️ No products found to test product detail page"
fi

# Test 4: Image Loading
echo ""
echo "🖼️ Testing image availability..."
images=("/images/products/bread1.jpg" "/images/products/cake1.jpg" "/og-image.jpg")
for image in "${images[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$image")
    if [ "$response" = "200" ]; then
        echo "   ✅ $image - Available"
    else
        echo "   ❌ $image - Not found (HTTP $response)"
    fi
done

echo ""
echo "🎉 Testing completed!"
echo "====================="

# Keep server running for manual testing
echo ""
echo "📝 Manual Testing Notes:"
echo "   - Server is still running at http://localhost:3000"
echo "   - Test the following manually:"
echo "     * Image loading on home page"
echo "     * Filter dropdowns on products page"
echo "     * Product search functionality"
echo "     * Add to cart functionality"
echo "     * User registration/login"
echo ""
echo "ℹ️ To stop the server, run: kill $SERVER_PID"
echo "   Or find the process with: ps aux | grep 'next dev'"
echo ""
echo "📊 Server logs are in: server.log"