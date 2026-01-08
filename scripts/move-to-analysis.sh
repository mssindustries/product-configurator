#!/bin/bash
# Move feature from backlog to in-analysis

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/move-to-analysis.sh {feature-slug}"
  exit 1
fi

FEATURE_SLUG="$1"
SOURCE_FILE="features/backlog/${FEATURE_SLUG}.md"
DEST_FILE="features/in-analysis/${FEATURE_SLUG}.md"
DATE=$(date +%Y-%m-%d)

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: Feature spec not found at $SOURCE_FILE"
  exit 1
fi

if [ -f "$DEST_FILE" ]; then
  echo "Error: Feature already exists in in-analysis at $DEST_FILE"
  exit 1
fi

# Move file
mv "$SOURCE_FILE" "$DEST_FILE"

# Update status and folder
sed -i "s/^\*\*Status\*\*:.*/\*\*Status\*\*: in-analysis/" "$DEST_FILE"
sed -i "s/^\*\*Folder\*\*:.*/\*\*Folder\*\*: in-analysis/" "$DEST_FILE"
sed -i "s/^\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: ${DATE}/" "$DEST_FILE"

echo "✅ Moved feature to in-analysis: $DEST_FILE"
echo ""
echo "Next steps:"
echo "1. Launch architect-reviewer agent to begin architecture review:"
echo "   Use the architect-reviewer agent to analyze the feature and fill in the Planning section"
echo "2. Enter plan mode to explore the codebase and design implementation"
echo "3. When planning is complete and ready to code, run:"
echo "   ./scripts/start-development.sh ${FEATURE_SLUG}"
