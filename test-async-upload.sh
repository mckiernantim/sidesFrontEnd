#!/bin/bash

#
# Test Async Upload Component
#
# Runs isolated tests to prove the upload component handles async responses correctly
#

echo "═══════════════════════════════════════════════════════"
echo "  Upload Component - Async Flow Test"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Testing upload modal progress updates with mocked server"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to frontend directory
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo ""

# Check if Jest is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js and npm${NC}"
    exit 1
fi

# Run the async upload test
echo "───────────────────────────────────────────────────────"
echo "Running: Upload Component Async Tests"
echo "───────────────────────────────────────────────────────"
echo ""

if npx jest src/app/components/landing-page/upload/upload.component.async.spec.ts --verbose --no-cache; then
    echo ""
    echo -e "${GREEN}✅ All Async Upload Tests PASSED${NC}"
    echo ""
    echo "What was tested:"
    echo "  ✅ Initial 'Uploading your document...' message"
    echo "  ✅ Progress updates to 'Scanning your document...'"
    echo "  ✅ Classification phase messages"
    echo "  ✅ 'Deleting original document...' message"
    echo "  ✅ Final 'Document ready!' message"
    echo "  ✅ Full progress sequence (0% → 100%)"
    echo "  ✅ Error handling without DOM elements"
    echo ""
    echo "Your component is ready to handle async Cloud Run responses! 🚀"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Missing dependencies (run: npm install)"
    echo "  - Test configuration issues"
    echo "  - Component import errors"
    echo ""
    exit 1
fi

