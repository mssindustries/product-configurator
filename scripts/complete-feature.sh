#!/bin/bash
# Move feature to complete folder

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/complete-feature.sh {feature-slug}"
  exit 1
fi

FEATURE_SLUG="$1"
SOURCE_FILE="features/in-development/${FEATURE_SLUG}.md"
DEST_FILE="features/complete/${FEATURE_SLUG}.md"
BRANCH_NAME="feature/${FEATURE_SLUG}"
DATE=$(date +%Y-%m-%d)

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: Feature spec not found at $SOURCE_FILE"
  exit 1
fi

if [ -f "$DEST_FILE" ]; then
  echo "Error: Feature already exists in complete folder at $DEST_FILE"
  exit 1
fi

# Move file
mv "$SOURCE_FILE" "$DEST_FILE"

# Update status and folder
sed -i "s/^\*\*Status\*\*:.*/\*\*Status\*\*: complete/" "$DEST_FILE"
sed -i "s/^\*\*Folder\*\*:.*/\*\*Folder\*\*: complete/" "$DEST_FILE"
sed -i "s/^\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: ${DATE}/" "$DEST_FILE"

echo "✅ Moved feature to complete: $DEST_FILE"
echo "✅ Updated status to: complete"
echo ""
echo "Next steps:"
echo "1. Update CHANGELOG.md with feature changes"
echo "2. Checkout main branch: git checkout main"
echo "3. Delete feature branch locally: git branch -d ${BRANCH_NAME}"
echo "4. Delete feature branch on remote: git push origin --delete ${BRANCH_NAME}"
