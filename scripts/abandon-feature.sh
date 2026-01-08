#!/bin/bash
# Abandon feature and move to complete with ABANDONED suffix

set -e

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: ./scripts/abandon-feature.sh {feature-slug} {current-folder} 'Reason for abandonment'"
  echo ""
  echo "Examples:"
  echo "  ./scripts/abandon-feature.sh my-feature backlog 'No longer needed'"
  echo "  ./scripts/abandon-feature.sh my-feature in-analysis 'Technical blocker'"
  echo "  ./scripts/abandon-feature.sh my-feature in-development 'Requirements changed'"
  exit 1
fi

FEATURE_SLUG="$1"
CURRENT_FOLDER="$2"
REASON="$3"
DATE=$(date +%Y-%m-%d)
SOURCE_FILE="features/${CURRENT_FOLDER}/${FEATURE_SLUG}.md"
ABANDONED_FILE="features/complete/${FEATURE_SLUG}-ABANDONED.md"
BRANCH_NAME="feature/${FEATURE_SLUG}"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Error: Feature spec not found at $SOURCE_FILE"
  exit 1
fi

# Update the Abandonment section
if grep -q "^### Abandonment" "$SOURCE_FILE"; then
  # Section exists, update it
  sed -i "/^### Abandonment/,/^---/{
    s/^\*\*Reason\*\*:.*/\*\*Reason\*\*: ${REASON}/
    s/^\*\*Date\*\*:.*/\*\*Date\*\*: ${DATE}/
    s/^\*\*Notes\*\*:.*/\*\*Notes\*\*: Feature development discontinued./
  }" "$SOURCE_FILE"
else
  # Add Abandonment section to Completion section
  sed -i "/^## Completion$/a\\
\\
### Abandonment\\
\\
**Reason**: ${REASON}\\
\\
**Date**: ${DATE}\\
\\
**Notes**: Feature development discontinued." "$SOURCE_FILE"
fi

# Update status
sed -i "s/^\*\*Status\*\*:.*/\*\*Status\*\*: abandoned/" "$SOURCE_FILE"
sed -i "s/^\*\*Folder\*\*:.*/\*\*Folder\*\*: complete/" "$SOURCE_FILE"
sed -i "s/^\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: ${DATE}/" "$SOURCE_FILE"

# Move file
mv "$SOURCE_FILE" "$ABANDONED_FILE"

echo "✅ Marked feature as abandoned: $REASON"
echo "✅ Moved to: $ABANDONED_FILE"
echo ""

# Check if branch exists and provide instructions
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  echo "Feature branch exists. Next steps:"
  echo "1. Checkout main: git checkout main"
  echo "2. Delete local branch: git branch -D ${BRANCH_NAME}"

  # Check if remote branch exists
  if git ls-remote --exit-code --heads origin "${BRANCH_NAME}" >/dev/null 2>&1; then
    echo "3. Delete remote branch: git push origin --delete ${BRANCH_NAME}"
  fi
else
  echo "No feature branch found (feature was abandoned before development started)."
fi
