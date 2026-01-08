# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MSS Industries Product Configurator - A B2B 3D product configurator platform for manufacturers of custom products (cabinets, fireplace covers, range hoods, etc.). Allows businesses to show customers real-time 3D visualizations of customizable products.

### User Types
- **Clients**: Businesses that manufacture custom products (configure available products/options)
- **Customers**: End users who view and customize products (no login required - view products while sitting with client)

## Tech Stack

- **Framework**: Next.js (App Router)
- **3D Rendering**: React Three Fiber + Three.js
- **Database**: SQLite + Prisma (single-file database, can migrate to Postgres later)
- **Language**: TypeScript
- **3D Format**: GLTF/GLB (standard web 3D format)
- **Utilities**: drei library for R3F helpers (controls, loaders, etc.)
- **Deployment**: Single container (Docker) or Vercel

## Core Data Model

```
Client (the business)
  - id, name, email

Product (belongs to Client)
  - id, clientId, name
  - modelUrl (GLTF/GLB file)
  - options (JSON - available customizations)

Configuration (saved customer customization)
  - id, productId
  - customerName, customerEmail
  - selections (JSON - chosen options)
  - createdAt
```

## Feature Development Workflow

This project uses a structured 4-folder workflow for managing features. Features progress through folders as they move from idea to completion.

### Folder Structure

- **features/backlog/** - Proposed features awaiting analysis
- **features/in-analysis/** - Features undergoing architecture review and planning
- **features/in-development/** - Features being actively implemented
- **features/complete/** - Completed or abandoned features

### Quick Start

1. **Propose Feature**: Run `./scripts/new-feature.sh "Feature Name"` to create spec in `features/backlog/`
2. **Start Analysis**: Run `./scripts/move-to-analysis.sh feature-slug` → Launch `architect-reviewer` agent
3. **Start Development**: Run `./scripts/start-development.sh feature-slug` → Creates feature branch and moves to in-development
4. **Complete**: Run `./scripts/complete-feature.sh feature-slug` → Moves to complete folder after PR merge

### Workflow Phases

**Phase 1: Backlog** (`features/backlog/`)
- Create feature spec using template
- Status: `backlog`
- No git branch yet

**Phase 2: Analysis** (`features/in-analysis/`)
- Launch `architect-reviewer` agent for architecture review
- Enter plan mode to explore codebase
- Design implementation approach
- Status: `in-analysis`
- No git branch yet (planning only)

**Phase 3: Development** (`features/in-development/`)
- **Git branch created here**: `feature/{feature-slug}`
- Launch `nextjs-developer` agent for implementation
- Use TodoWrite to track progress
- Commit at milestones (data model, API, components, integration)
- Launch `code-reviewer` agent when ready
- Run tests and validate acceptance criteria
- Status progression: `in-development` → `in-review` → `testing` → `ready-to-merge`

**Phase 4: Complete** (`features/complete/`)
- PR merged to main
- Feature branch deleted
- Status: `complete` or `abandoned`

### Status Flow
```
backlog → in-analysis → in-development → complete

Development substatus:
in-development → in-review → testing → ready-to-merge → complete
```

### Feature Spec Template

All features use the template at `features/TEMPLATE.md` with these sections:
- Summary & Requirements
- Acceptance Criteria
- Data Model & API Changes
- Dependencies
- Planning (auto-filled by agents during analysis)
- Development Notes
- Code Review (auto-filled by code-reviewer)
- Testing
- Completion

### Git Workflow

- **Branch naming**: `feature/{feature-slug}`
- **Branch creation**: Only when moving to in-development (not during backlog/analysis)
- **Commit at milestones**: Data model changes, API implementation, components, integration complete
- **PR from feature branch** to `main`
- **Delete branch** after merge

### Specialized Agents

- **architect-reviewer**: Reviews architecture during in-analysis phase, identifies risks and integration points
- **nextjs-developer**: Implements features during in-development phase, follows Next.js best practices
- **code-reviewer**: Reviews code quality, security, and performance before merge
- **prompt-engineer**: Helps clarify requirements and structure specs (optional)

### Helper Scripts

- `scripts/new-feature.sh "Name"` - Create new feature in backlog
- `scripts/move-to-analysis.sh slug` - Move to in-analysis folder
- `scripts/start-development.sh slug` - Move to in-development + create branch
- `scripts/complete-feature.sh slug` - Move to complete folder
- `scripts/abandon-feature.sh slug folder "reason"` - Abandon feature

See `scripts/README.md` for detailed usage.

## Workflow Preferences

### Plan-First Approach

For non-trivial features, follow this workflow:

1. **User provides task**
2. **Enter plan mode** (using EnterPlanMode)
   - Explore the codebase thoroughly
   - Design the implementation approach
   - Present the plan for approval
3. **User approves or adjusts the plan**
4. **Execute in larger chunks** (user prefers fewer interruptions)
   - Use TodoWrite to track progress and give visibility
   - Keep user updated as work progresses through major steps
   - Ask questions early if unclear about implementation choices (use AskUserQuestion)
5. **Commit when complete**

### Key Principles

- **Spec-first**: Start with written requirements (see SPEC.md)
- **Break work into chunks**: Complete one chunk, get review, move to next
- **Plan before building**: Get approval on approach before deep implementation
- **Larger chunks OK**: User is comfortable with larger implementations if planned first
- **Use todo lists**: Track progress and provide visibility throughout
- **Commit at milestones**: Natural review points after meaningful chunks

## Development Preferences
- USE pnpm.