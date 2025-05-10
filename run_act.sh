#!/bin/bash
# Script to test the GitHub Action locally using act

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${RED}Error: 'act' is not installed. Please install it first:${NC}"
    echo "  mise use act (recommended)"
    echo "  or"
    echo "  go install github.com/nektos/act@latest"
    echo "  or"
    echo "  brew install act"
    exit 1
fi

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Warning: GITHUB_TOKEN is not set. Using `gh auth token`.${NC}"
    export GITHUB_TOKEN=$(gh auth token)
fi

# Ensure the action is built
echo -e "${BLUE}Building the action...${NC}"
bash ./build.sh

# Run the local test
echo -e "${BLUE}Testing the action with act...${NC}"
act --job $1 \
    --eventpath events/issue_comment.created.json \
    --bind \
    -s GITHUB_TOKEN=$GITHUB_TOKEN
    # --verbose

# Check if the test was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Test completed successfully!${NC}"
else
    echo -e "${RED}Test failed. See above for errors.${NC}"
    exit 1
fi
