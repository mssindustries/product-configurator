---
name: work-on-issue
description: Start work on a GitHub issue (fetches details, creates branch, follows workflow)
arguments:
  - name: issue_number
    description: "GitHub issue number"
    required: true
---

# Work on Issue

Start work on a GitHub issue by fetching details, creating a branch, and following the workflow defined in CLAUDE.md.

## Instructions

### 1. Fetch Issue Details

```bash
gh issue view {{issue_number}} --json number,title,body,state,labels,projectItems --repo mssindustries/product-configurator
```

Parse the response to get:
- Issue number
- Issue title
- Issue body
- Current project status (from projectItems)
- Issue type (Feature, Task, Bug)

### 2. Create Branch

Create a branch following the naming convention from CLAUDE.md:

```bash
# Convert title to slug (lowercase, replace spaces with hyphens, remove special chars)
# Format: issue/{number}-{slug}
git checkout -b issue/{{issue_number}}-{{slug}}
```

If a branch already exists for this issue, check it out instead.

### 3. Follow Status-Specific Workflow

Based on the project status from step 1, follow the **Status-Specific Workflow** defined in the `GitHub Issue Workflow` section of CLAUDE.md:

- **Backlog** → See "Backlog" workflow in CLAUDE.md
- **In Analysis** → See "In Analysis" workflow in CLAUDE.md
- **Planning** → See "Planning" workflow in CLAUDE.md
- **In Development** → See "In Development" workflow in CLAUDE.md

The workflow includes:
- When to move between statuses
- How to format issues
- When to create implementation plans
- How to follow TDD practices
- Domain-specific guidance (Frontend, Backend, Infrastructure)

### 4. Provide Summary

After setup, provide a summary to the user:
- Issue number and title
- Current branch
- Current project status
- Next steps based on the workflow from CLAUDE.md

## Example Usage

```
/work-on-issue 123
```

Result:
- Fetches issue #123
- Creates branch `issue/123-add-user-authentication`
- Identifies current status
- Reports next steps based on CLAUDE.md workflow
