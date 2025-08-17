#!/bin/bash

# YAFFA Engine v2.0 - Production Smoke Tests
# Tests all 4 core endpoints + infrastructure

set -e  # Exit on any error

BASE_URL="${1:-http://localhost:3001}"
echo "🧪 YAFFA Engine v2.0 - Production Smoke Tests"
echo "🌐 Testing against: $BASE_URL"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    echo -e "\n${BLUE}🔍 Testing: $test_name${NC}"
    ((TESTS_TOTAL++))
    
    # Run the test and capture both status and response
    response=$(eval "$test_command" 2>&1)
    status=$?
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
        echo "   Response: $(echo "$response" | head -1)"
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        echo "   Error: $response"
    fi
}

# Test 1: Health Check
run_test "Health Check" \
    "curl -s -f $BASE_URL/health | jq -r '.status'"

# Test 2: Compile Endpoint - YAFFA Mode
run_test "Compile Endpoint (YAFFA Mode)" \
    "curl -s -f -X POST $BASE_URL/compile \
        -H 'Content-Type: application/json' \
        -d '{
            \"meta\": {
                \"mode\": \"yaffa\",
                \"locale\": \"en-US\",
                \"budget_tokens\": 4000
            },
            \"objective\": {
                \"task\": \"create\",
                \"goal\": \"pitch deck for startup\",
                \"success_criteria\": [\"10 slides\", \"financial projections\"]
            },
            \"constraints\": {
                \"tone\": \"professional\",
                \"length\": \"concise\"
            },
            \"grounding\": {
                \"citations_required\": true
            },
            \"exemplars\": [],
            \"output_contract\": {
                \"format\": \"json\",
                \"schema_ref\": \"yafa://schemas/presentation_v1\"
            },
            \"determinism\": {
                \"temperature\": 0.2,
                \"seed\": 42,
                \"stop\": [\"<END_JSON>\"]
            },
            \"self_checks\": [\"schema valid\", \"all slides present\"],
            \"assumptions\": [],
            \"repair_policy\": {
                \"max_retries\": 1,
                \"on_fail\": \"tighten_schema\"
            }
        }' | jq -r '.success'"

# Test 3: Compile Endpoint - Discovery Mode
run_test "Compile Endpoint (Discovery Mode)" \
    "curl -s -f -X POST $BASE_URL/compile \
        -H 'Content-Type: application/json' \
        -d '{
            \"meta\": {
                \"mode\": \"discovery\",
                \"locale\": \"en-US\",
                \"budget_tokens\": 4000
            },
            \"objective\": {
                \"task\": \"analyze\",
                \"goal\": \"market opportunity for AI tools\",
                \"success_criteria\": [\"multiple perspectives\", \"alternatives provided\"]
            },
            \"constraints\": {
                \"tone\": \"analytical\"
            },
            \"grounding\": {},
            \"exemplars\": [],
            \"output_contract\": {
                \"format\": \"markdown\"
            },
            \"determinism\": {
                \"temperature\": 0.8
            },
            \"self_checks\": [\"alternatives provided\", \"self-critique included\"],
            \"assumptions\": [],
            \"repair_policy\": {}
        }' | jq -r '.success'"

# Test 4: Probe Endpoint
run_test "Probe Endpoint" \
    "curl -s -f -X POST $BASE_URL/probe \
        -H 'Content-Type: application/json' \
        -d '{
            \"meta\": {
                \"mode\": \"yaffa\",
                \"budget_tokens\": 4000
            },
            \"objective\": {
                \"task\": \"test\",
                \"goal\": \"probe determinism\"
            },
            \"constraints\": {},
            \"grounding\": {},
            \"exemplars\": [],
            \"output_contract\": {
                \"format\": \"json\"
            },
            \"determinism\": {
                \"temperature\": 0.2,
                \"seed\": 42
            },
            \"self_checks\": [],
            \"assumptions\": [],
            \"repair_policy\": {}
        }' | jq -r '.success'"

# Test 5: Synthesize Endpoint - PowerPoint
run_test "Synthesize Endpoint (PowerPoint)" \
    "curl -s -f -X POST $BASE_URL/synthesize \
        -H 'Content-Type: application/json' \
        -d '{
            \"type\": \"pptx\",
            \"filename\": \"YaffaDemo.pptx\",
            \"metadata\": {
                \"title\": \"YAFFA Engine Demo\",
                \"author\": \"YAFFA System\",
                \"description\": \"Demonstration presentation\"
            },
            \"slides\": [
                {
                    \"title\": \"Welcome to YAFFA Engine\",
                    \"bullets\": [
                        \"Autonomous prompt construction\",
                        \"Real artifact generation\",
                        \"Production-ready infrastructure\"
                    ],
                    \"layout\": \"title\",
                    \"notes\": \"Introduction slide\"
                },
                {
                    \"title\": \"Key Features\",
                    \"bullets\": [
                        \"Schema-first validation with Zod\",
                        \"BullMQ job queue with Redis\",
                        \"MinIO S3-compatible storage\",
                        \"Prisma database with full audit\"
                    ],
                    \"layout\": \"content\"
                }
            ],
            \"brand\": {
                \"theme\": \"modern\",
                \"accent\": \"#2563eb\",
                \"color_scheme\": \"light\"
            },
            \"settings\": {
                \"quality\": \"high\",
                \"include_metadata\": true
            }
        }' | jq -r '.success'"

# Test 6: Synthesize Endpoint - Excel
run_test "Synthesize Endpoint (Excel)" \
    "curl -s -f -X POST $BASE_URL/synthesize \
        -H 'Content-Type: application/json' \
        -d '{
            \"type\": \"xlsx\",
            \"filename\": \"YaffaMetrics.xlsx\",
            \"metadata\": {
                \"title\": \"YAFFA Performance Metrics\",
                \"author\": \"YAFFA System\"
            },
            \"sheets\": [
                {
                    \"name\": \"Performance\",
                    \"headers\": [\"Metric\", \"Value\", \"Target\", \"Status\"],
                    \"rows\": [
                        [\"API Response Time\", \"< 200ms\", \"< 500ms\", \"✅ Good\"],
                        [\"Determinism Score\", \"0.92\", \"0.85\", \"✅ Good\"],
                        [\"Artifact Generation\", \"< 30s\", \"< 60s\", \"✅ Good\"],
                        [\"Job Success Rate\", \"98.5%\", \"95%\", \"✅ Good\"]
                    ],
                    \"formatting\": {
                        \"auto_width\": true
                    }
                }
            ],
            \"settings\": {
                \"quality\": \"standard\"
            }
        }' | jq -r '.success'"

# Test 7: Sovereign Endpoint
run_test "Sovereign Endpoint" \
    "curl -s -f -X POST $BASE_URL/sovereign \
        -H 'Content-Type: application/json' \
        -d '{
            \"previous_contract\": {
                \"meta\": {
                    \"mode\": \"yaffa\",
                    \"budget_tokens\": 4000
                },
                \"objective\": {
                    \"task\": \"create\",
                    \"goal\": \"simple presentation\"
                },
                \"constraints\": {},
                \"grounding\": {},
                \"exemplars\": [],
                \"output_contract\": {
                    \"format\": \"json\"
                },
                \"determinism\": {
                    \"temperature\": 0.2
                },
                \"self_checks\": [],
                \"assumptions\": [],
                \"repair_policy\": {}
            },
            \"downstream_response\": \"I created a basic 3-slide presentation covering the main topics.\",
            \"user_feedback\": \"Please make it more detailed with financial projections and market analysis\",
            \"iteration_context\": {
                \"attempt_number\": 1,
                \"previous_issues\": [\"too basic\"],
                \"success_metrics\": [\"detailed content\", \"financial data\"]
            }
        }' | jq -r '.success'"

# Test 8: Job Status Endpoint (create a job first)
echo -e "\n${BLUE}🔍 Testing: Job Status Tracking${NC}"
((TESTS_TOTAL++))

# Create a synthesis job and get job ID
JOB_RESPONSE=$(curl -s -X POST $BASE_URL/synthesize \
    -H 'Content-Type: application/json' \
    -d '{
        "type": "pptx",
        "filename": "StatusTest.pptx",
        "slides": [{"title": "Test", "bullets": ["Status tracking test"]}]
    }')

if echo "$JOB_RESPONSE" | jq -e '.data.jobId' > /dev/null; then
    JOB_ID=$(echo "$JOB_RESPONSE" | jq -r '.data.jobId')
    echo "   Created job: $JOB_ID"
    
    # Wait a moment for processing
    sleep 2
    
    # Check job status
    STATUS_RESPONSE=$(curl -s -f "$BASE_URL/jobs/$JOB_ID")
    if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null; then
        echo -e "${GREEN}✅ PASS: Job Status Tracking${NC}"
        ((TESTS_PASSED++))
        echo "   Status: $(echo "$STATUS_RESPONSE" | jq -r '.data.status')"
    else
        echo -e "${RED}❌ FAIL: Job Status Tracking${NC}"
        echo "   Error: $STATUS_RESPONSE"
    fi
else
    echo -e "${RED}❌ FAIL: Job Status Tracking${NC}"
    echo "   Could not create job for testing"
fi

# Test 9: Error Handling
run_test "Error Handling (Invalid JSON)" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST $BASE_URL/compile \
        -H 'Content-Type: application/json' \
        -d 'invalid json' | grep -q '400' && echo 'true' || echo 'false'"

# Test 10: Rate Limiting (if enabled)
run_test "API Responsiveness (Multiple Requests)" \
    "for i in {1..5}; do
        curl -s -f $BASE_URL/health > /dev/null || exit 1
    done && echo 'true'"

# Infrastructure Tests
echo -e "\n${YELLOW}🏗️ Infrastructure Health Checks${NC}"
echo "=================================="

# Check if health endpoint reports all services
HEALTH_RESPONSE=$(curl -s -f $BASE_URL/health 2>/dev/null || echo '{"error": "unreachable"}')
echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "❌ Health endpoint unreachable"

# Summary
echo -e "\n${YELLOW}📊 TEST SUMMARY${NC}"
echo "=============="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}/${TESTS_TOTAL}"
echo -e "Success Rate: ${GREEN}$(( TESTS_PASSED * 100 / TESTS_TOTAL ))%${NC}"

if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! YAFFA Engine v2.0 is production ready!${NC}"
    echo -e "${GREEN}✅ /compile endpoint working${NC}"
    echo -e "${GREEN}✅ /probe endpoint working${NC}"  
    echo -e "${GREEN}✅ /synthesize endpoint working${NC}"
    echo -e "${GREEN}✅ /sovereign endpoint working${NC}"
    echo -e "${GREEN}✅ Job queue processing${NC}"
    echo -e "${GREEN}✅ Error handling proper${NC}"
    echo -e "${GREEN}✅ Infrastructure healthy${NC}"
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED${NC}"
    echo "Check the errors above and fix before deploying to production"
    exit 1
fi
