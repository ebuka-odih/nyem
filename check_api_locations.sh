#!/bin/bash

API_BASE="https://api.nyem.online/backend/public/api"

echo "=== Checking User Locations via API ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Login function
login_user() {
    local username=$1
    local password=$2
    
    echo -e "${YELLOW}Logging in as: $username${NC}"
    response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username_or_phone\":\"$username\",\"password\":\"$password\"}")
    
    token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$token" ]; then
        echo -e "${RED}✗ Login failed${NC}"
        echo "$response"
        return 1
    else
        echo -e "${GREEN}✓ Login successful${NC}"
        echo "$token"
    fi
}

# Get location status
get_location_status() {
    local token=$1
    local username=$2
    
    echo -e "\n${YELLOW}=== $username Location Status ===${NC}"
    curl -s -X GET "$API_BASE/location/status" \
        -H "Authorization: Bearer $token" | python3 -m json.tool 2>/dev/null || curl -s -X GET "$API_BASE/location/status" -H "Authorization: Bearer $token"
}

# Update location
update_location() {
    local token=$1
    local username=$2
    local lat=$3
    local lon=$4
    
    echo -e "\n${YELLOW}Updating $username location to: $lat, $lon${NC}"
    curl -s -X POST "$API_BASE/location/update" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{\"latitude\":$lat,\"longitude\":$lon}" | python3 -m json.tool 2>/dev/null || echo "Update response received"
}

# Check feed for distance
check_feed_distance() {
    local token=$1
    
    echo -e "\n${YELLOW}=== Feed Distance Check ===${NC}"
    response=$(curl -s -X GET "$API_BASE/items/feed" \
        -H "Authorization: Bearer $token")
    
    echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'items' in data and len(data['items']) > 0:
        print(f\"Found {len(data['items'])} items\n\")
        for i, item in enumerate(data['items'][:3], 1):
            print(f\"Item {i}: {item.get('title', 'N/A')[:30]}\")
            owner = item.get('user', {})
            print(f\"  Owner: {owner.get('username', 'N/A')}\")
            print(f\"  Distance: {item.get('distance_km', 'N/A')} km\")
            if owner.get('latitude'):
                print(f\"  Owner Location: {owner.get('latitude')}, {owner.get('longitude')}\")
            print()
    else:
        print('No items in feed')
except Exception as e:
    print(f'Error parsing: {e}')
    print(response[:500])
"
}

# Main
echo "Enter credentials for demo and tester users:"
read -p "Demo username/phone: " DEMO_USER
read -sp "Demo password: " DEMO_PASS
echo ""
read -p "Tester username/phone: " TESTER_USER
read -sp "Tester password: " TESTER_PASS
echo ""

# Login
DEMO_TOKEN=$(login_user "$DEMO_USER" "$DEMO_PASS")
if [ -z "$DEMO_TOKEN" ]; then exit 1; fi

TESTER_TOKEN=$(login_user "$TESTER_USER" "$TESTER_PASS")
if [ -z "$TESTER_TOKEN" ]; then exit 1; fi

# Check current locations
echo -e "\n${GREEN}=== Current Locations ===${NC}"
get_location_status "$DEMO_TOKEN" "demo"
get_location_status "$TESTER_TOKEN" "tester"

# Offer to update
echo -e "\n${YELLOW}Set test locations? (y/n)${NC}"
read -p "> " answer

if [ "$answer" = "y" ]; then
    update_location "$DEMO_TOKEN" "demo" "9.0617555" "7.3680915"
    update_location "$TESTER_TOKEN" "tester" "9.0717555" "7.3680915"
    echo -e "\n${GREEN}Locations updated!${NC}"
fi

# Check feed
check_feed_distance "$TESTER_TOKEN"

echo -e "\n${GREEN}Done!${NC}"
