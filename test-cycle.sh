#!/bin/bash

# Full cycle test script for Dorety Bakery

echo "🧪 Starting full cycle testing for Dorety Bakery..."

# Test 1: Check if the server is running
echo "1. Testing server availability..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && echo "✅ Server is running" || echo "❌ Server is not responding"

# Test 2: Test API endpoints
echo "2. Testing API endpoints..."

# Test products API
echo "   - Testing products API..."
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/products)
http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ]; then
    echo "   ✅ Products API working"
else
    echo "   ❌ Products API failed (HTTP $http_code)"
fi

# Test categories API
echo "   - Testing categories API..."
response=$(curl -s -w "%{http_code}" http://localhost:3000/api/categories)
http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ]; then
    echo "   ✅ Categories API working"
else
    echo "   ❌ Categories API failed (HTTP $http_code)"
fi

# Test banners API
echo "   - Testing banners API..."
response=$(curl -s -w "%{http_code}" "http://localhost:3000/api/banners?page=home&userType=ALL")
http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ]; then
    echo "   ✅ Banners API working"
else
    echo "   ❌ Banners API failed (HTTP $http_code)"
fi

# Test 3: Check key pages load
echo "3. Testing page loading..."

pages=("/" "/products" "/about" "/contact" "/login" "/register")

for page in "${pages[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$page")
    if [ "$response" = "200" ]; then
        echo "   ✅ $page loads successfully"
    else
        echo "   ❌ $page failed to load (HTTP $response)"
    fi
done

echo "🎉 Full cycle testing completed!"