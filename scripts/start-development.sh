#!/bin/bash
# Move feature to in-development and create feature branch

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/start-development.sh {feature-slug}"
  exit 1
fi

FEATURE_SLUG="$1"
SOURCE_FILE="features/in-analysis/${FEATURE_SLUG}.md"
DEST_FILE="features/in-development/${FEATURE_SLUG}.md"
BRANCH_NAME="feature/${FEATURE_SLUG}"
DATE=$(date +%Y-%m-%d)

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: Feature spec not found at $SOURCE_FILE"
  echo "Make sure the feature is in the in-analysis folder first."
  exit 1
fi

if [ -f "$DEST_FILE" ]; then
  echo "Error: Feature already exists in in-development at $DEST_FILE"
  exit 1
fi

# Move file
mv "$SOURCE_FILE" "$DEST_FILE"

# Update status, folder, and add branch info
sed -i "s/^\*\*Status\*\*:.*/\*\*Status\*\*: in-development/" "$DEST_FILE"
sed -i "s/^\*\*Folder\*\*:.*/\*\*Folder\*\*: in-development/" "$DEST_FILE"
sed -i "s/^\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: ${DATE}/" "$DEST_FILE"

# Add branch line after Feature Slug line
sed -i "/^\*\*Feature Slug\*\*:/a\\
\\
**Branch**: ${BRANCH_NAME}" "$DEST_FILE"

# Create and checkout feature branch
git checkout -b "$BRANCH_NAME"

echo "✅ Moved feature to in-development: $DEST_FILE"
echo "✅ Created and checked out branch: $BRANCH_NAME"
echo ""
echo "Next steps:"
echo "1. Launch nextjs-developer agent to begin implementation"
echo "2. Use TodoWrite to track implementation progress"
echo "3. Commit at milestones (data model, API, components, integration)"
echo "4. When ready for review, launch code-reviewer agent"
echo "5. After tests pass and review approved, run:"
echo "   ./scripts/complete-feature.sh ${FEATURE_SLUG}"
