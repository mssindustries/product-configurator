#!/bin/bash
# Create new feature from template

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/new-feature.sh 'Feature Name'"
  exit 1
fi

FEATURE_NAME="$1"
FEATURE_SLUG=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
DATE=$(date +%Y-%m-%d)
SPEC_FILE="features/backlog/${FEATURE_SLUG}.md"

# Check if already exists
if [ -f "$SPEC_FILE" ]; then
  echo "Error: Feature spec already exists at $SPEC_FILE"
  exit 1
fi

# Copy template
cp features/TEMPLATE.md "$SPEC_FILE"

# Replace placeholders
sed -i "s/{Feature Name}/${FEATURE_NAME}/g" "$SPEC_FILE"
sed -i "s/{kebab-case-slug}/${FEATURE_SLUG}/g" "$SPEC_FILE"
sed -i "s/{YYYY-MM-DD}/${DATE}/g" "$SPEC_FILE"

# Set initial status and folder
sed -i "s/^\*\*Status\*\*:.*/\*\*Status\*\*: backlog/" "$SPEC_FILE"
sed -i "s/^\*\*Folder\*\*:.*/\*\*Folder\*\*: backlog/" "$SPEC_FILE"

# Remove branch line since we don't have a branch yet in backlog
sed -i '/^\*\*Branch\*\*:/d' "$SPEC_FILE"

echo "✅ Created feature spec: $SPEC_FILE"
echo ""
echo "Next steps:"
echo "1. Edit $SPEC_FILE and fill in requirements, acceptance criteria, etc."
echo "2. When ready for architecture review, run:"
echo "   ./scripts/move-to-analysis.sh ${FEATURE_SLUG}"
