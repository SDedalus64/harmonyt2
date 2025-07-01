#!/bin/bash

# Script to install git hooks for HarmonyTi development
# This sets up a pre-commit hook that reminds developers to update CHANGELOG.md

echo "Installing HarmonyTi git hooks..."

# Create the pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Check if CHANGELOG.md has been modified
if git diff --cached --name-only | grep -q "CHANGELOG.md"; then
    echo -e "${GREEN}✓ CHANGELOG.md has been updated${NC}"
else
    echo -e "${YELLOW}⚠️  REMINDER: Have you updated CHANGELOG.md?${NC}"
    echo -e "${YELLOW}   If this commit includes user-facing changes, please update the changelog.${NC}"
    echo -e "${YELLOW}   Add your changes under the [Unreleased] section.${NC}"
    echo ""
    echo -e "${YELLOW}   Categories: Added, Changed, Fixed, Removed, Security, Performance${NC}"
    echo ""
    echo -e "${YELLOW}   To skip this reminder (for non-user-facing changes), use:${NC}"
    echo -e "${YELLOW}   git commit --no-verify${NC}"
    echo ""
    read -p "Continue with commit? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Commit cancelled. Please update CHANGELOG.md and try again.${NC}"
        exit 1
    fi
fi

# Run other checks (linting, tests, etc.)
# Add your other pre-commit checks here
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now remind you to update CHANGELOG.md"
echo "for any user-facing changes."
echo ""
echo "To bypass the hook (for internal changes), use: git commit --no-verify" 