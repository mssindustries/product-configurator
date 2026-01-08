# Feature Workflow Helper Scripts

This directory contains bash scripts to automate the feature development workflow. These scripts manage feature specs as they progress through the 4-folder structure: backlog → in-analysis → in-development → complete.

## Prerequisites

- Bash shell
- Git
- sed command (standard on Linux/Mac)

## Scripts Overview

### 1. new-feature.sh

Create a new feature spec in the backlog folder.

**Usage:**
```bash
./scripts/new-feature.sh "Feature Name"
```

**What it does:**
- Creates a new feature spec from `features/TEMPLATE.md`
- Converts feature name to kebab-case slug
- Places spec in `features/backlog/{feature-slug}.md`
- Sets status to `backlog`
- Replaces all placeholders with actual values
- Does NOT create a git branch (that happens later)

**Example:**
```bash
./scripts/new-feature.sh "Customer Info Form"
# Creates: features/backlog/customer-info-form.md
```

**Next steps:**
1. Edit the spec file and fill in requirements, acceptance criteria, data model changes, etc.
2. When ready for architecture review, run `move-to-analysis.sh`

---

### 2. move-to-analysis.sh

Move a feature from backlog to in-analysis for architecture review and planning.

**Usage:**
```bash
./scripts/move-to-analysis.sh {feature-slug}
```

**What it does:**
- Moves spec from `features/backlog/` to `features/in-analysis/`
- Updates status to `in-analysis`
- Updates folder metadata
- Updates last modified date
- Still no git branch (planning is read-only)

**Example:**
```bash
./scripts/move-to-analysis.sh customer-info-form
# Moves to: features/in-analysis/customer-info-form.md
```

**Next steps:**
1. Launch `architect-reviewer` agent to perform architecture review
2. Enter plan mode to explore codebase and design implementation
3. Agents will fill in the Planning section with architecture review and implementation plan
4. When planning is complete, run `start-development.sh`

---

### 3. start-development.sh

Move a feature to in-development and create the feature branch.

**Usage:**
```bash
./scripts/start-development.sh {feature-slug}
```

**What it does:**
- Moves spec from `features/in-analysis/` to `features/in-development/`
- Updates status to `in-development`
- **Creates feature branch**: `feature/{feature-slug}`
- Checks out the new branch
- Adds branch info to spec file
- Updates folder and date metadata

**Example:**
```bash
./scripts/start-development.sh customer-info-form
# Moves to: features/in-development/customer-info-form.md
# Creates branch: feature/customer-info-form
```

**Next steps:**
1. Launch `nextjs-developer` agent to begin implementation
2. Use TodoWrite to track progress through implementation tasks
3. Commit at milestones (data model, API, components, integration)
4. Launch `code-reviewer` agent when ready for review
5. Run tests and validate acceptance criteria
6. When PR is merged, run `complete-feature.sh`

---

### 4. complete-feature.sh

Move a completed feature to the complete folder.

**Usage:**
```bash
./scripts/complete-feature.sh {feature-slug}
```

**What it does:**
- Moves spec from `features/in-development/` to `features/complete/`
- Updates status to `complete`
- Updates folder and date metadata
- Provides instructions for branch cleanup

**Example:**
```bash
./scripts/complete-feature.sh customer-info-form
# Moves to: features/complete/customer-info-form.md
```

**Next steps:**
1. Update CHANGELOG.md with feature changes
2. Switch back to main: `git checkout main`
3. Delete local branch: `git branch -d feature/customer-info-form`
4. Delete remote branch: `git push origin --delete feature/customer-info-form`

---

### 5. abandon-feature.sh

Abandon a feature at any stage and move it to complete with ABANDONED suffix.

**Usage:**
```bash
./scripts/abandon-feature.sh {feature-slug} {current-folder} "Reason for abandonment"
```

**What it does:**
- Adds abandonment information to the spec
- Updates status to `abandoned`
- Moves spec to `features/complete/{feature-slug}-ABANDONED.md`
- Provides branch deletion instructions if branch exists

**Examples:**
```bash
# Abandon a feature in backlog (before any work started)
./scripts/abandon-feature.sh my-feature backlog "No longer needed"

# Abandon during analysis phase
./scripts/abandon-feature.sh my-feature in-analysis "Technical blocker found"

# Abandon during development
./scripts/abandon-feature.sh my-feature in-development "Requirements changed significantly"
```

**Next steps:**
- If branch exists, delete it:
  ```bash
  git checkout main
  git branch -D feature/{feature-slug}
  git push origin --delete feature/{feature-slug}
  ```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Feature Workflow                           │
└─────────────────────────────────────────────────────────────────┘

 new-feature.sh "Name"
         ↓
   ┌─────────────┐
   │  BACKLOG    │  Status: backlog
   │             │  No git branch
   └─────────────┘
         ↓
 move-to-analysis.sh slug
         ↓
   ┌─────────────┐
   │ IN-ANALYSIS │  Status: in-analysis
   │             │  Launch architect-reviewer
   │             │  Enter plan mode
   │             │  No git branch (planning only)
   └─────────────┘
         ↓
 start-development.sh slug
         ↓
   ┌─────────────┐
   │IN-DEVELOPMENT│ Status: in-development → in-review → testing
   │             │  CREATE BRANCH: feature/{slug}
   │             │  Launch nextjs-developer
   │             │  Use TodoWrite
   │             │  Launch code-reviewer
   └─────────────┘
         ↓
 complete-feature.sh slug
         ↓
   ┌─────────────┐
   │  COMPLETE   │  Status: complete
   │             │  Delete branch
   └─────────────┘

  At any point: abandon-feature.sh slug folder "reason"
         ↓
   ┌─────────────┐
   │  COMPLETE   │  Status: abandoned
   │ (ABANDONED) │  File suffix: -ABANDONED
   └─────────────┘
```

## Folder Structure

```
features/
├── backlog/           # Proposed features
│   └── {slug}.md
├── in-analysis/       # Architecture review & planning
│   └── {slug}.md
├── in-development/    # Active implementation
│   └── {slug}.md
├── complete/          # Done
│   ├── {slug}.md
│   └── {slug}-ABANDONED.md
└── TEMPLATE.md        # Feature spec template
```

## Git Branch Naming

- **Format**: `feature/{feature-slug}`
- **Created**: Only when moving to in-development
- **Examples**:
  - `feature/customer-info-form`
  - `feature/3d-material-selector`
  - `feature/save-configuration`

## Status Values

Features progress through these statuses:

1. **backlog** - Initial proposal
2. **in-analysis** - Architecture review and planning
3. **in-development** - Active coding
4. **in-review** - Code review in progress
5. **testing** - Testing and validation
6. **ready-to-merge** - All checks passed, ready for PR merge
7. **complete** - PR merged, feature done
8. **abandoned** - Feature discontinued

## Troubleshooting

### "Feature spec not found"
- Check that you're using the correct feature-slug (kebab-case)
- Verify the feature is in the expected folder
- Use `ls features/{folder}/` to see what's there

### "Feature already exists in destination"
- The feature may have already been moved
- Check all folders: `find features/ -name "{slug}.md"`
- If moving backward in the workflow, manually move the file

### "Branch already exists"
- Another feature may have the same name
- Check branches: `git branch -a | grep feature/`
- Choose a different feature name

### sed errors on macOS
- macOS sed requires different syntax for in-place editing
- Update scripts to use `sed -i '' "..."` instead of `sed -i "..."`
- Or install GNU sed: `brew install gnu-sed` and use `gsed`

## Tips

1. **Always fill in requirements before moving to analysis** - The architect-reviewer needs context
2. **Commit your spec changes** - Git track your feature specs as they evolve
3. **Use descriptive feature names** - "Customer Info Form" not "Form" or "Feature 1"
4. **Abandon early if needed** - Don't be afraid to abandon features that don't make sense
5. **Review the plan before development** - Ensure the implementation plan is solid before creating the branch

## See Also

- `features/TEMPLATE.md` - Feature spec template with all sections
- `CLAUDE.md` - Full feature workflow documentation
- `SPEC.md` - Project requirements and roadmap
