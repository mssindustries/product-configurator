# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MSS Industries Product Customizer - A B2B 3D product customizer platform for manufacturers of custom products (cabinets, fireplace covers, range hoods, etc.). Allows businesses to show customers real-time 3D visualizations of customizable products.

## Tech Stack

### Frontend (`src/frontend/`)
- **Framework**: Vite + React 18
- **3D Rendering**: React Three Fiber + Three.js
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Routing**: React Router

### Backend (`src/backend/`)
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL + SQLAlchemy 2.0 (async)
- **Migrations**: Alembic (NOT needed until production deployment - use SQLAlchemy create_all for dev)
- **3D Generation**: Blender (headless)
- **Storage**: Azure Blob Storage

### Infrastructure
- **Local Dev**: Docker Compose (PostgreSQL, Azurite, FastAPI+Blender)
- **Deployment**: Azure Static Web Apps (frontend) + Azure Container Apps (backend)
- **3D Format**: GLTF/GLB

## Plugins & Automation

This project uses Claude Code plugins. Use them proactively, not as a last resort.

### Quick Reference

| Task | Command/Agent | Notes |
|------|---------------|-------|
| Work on GitHub issue | `/work-on-issue` | Fetch issue, create branch, follow workflow |
| Start new feature | `/feature-dev` | Guided workflow with architecture focus |
| Design React UI | `/frontend-design` | High-quality, distinctive interfaces |
| Create commit | `/commit` | Auto-generates message from changes |
| Commit + PR | `/commit-push-pr` | Full workflow in one step |
| Review PR | `/code-review` | Structured quality review |
| Debug issue | `superpowers:systematic-debugging` | 4-phase root cause analysis |
| Write tests first | `superpowers:test-driven-development` | RED-GREEN-REFACTOR cycle |
| Backend work | `fastapi-pro` agent | FastAPI endpoints, SQLAlchemy models |
| Frontend work | `typescript-pro` agent | React components, hooks |
| Explore code | `Explore` agent | Fast codebase search |

### Skills

Skills are plugin-provided prompts. Invoke with `/skill-name`. Some require fully qualified names (e.g., `superpowers:brainstorming`).

**Planning & Design:**
| Skill | Invoke As | Description |
|-------|-----------|-------------|
| Feature development | `/feature-dev` | Guided workflow with codebase awareness |
| Frontend design | `/frontend-design` | Create distinctive React UIs |
| Brainstorming | `superpowers:brainstorming` | Refine ideas before implementation |
| Writing plans | `superpowers:writing-plans` | Create detailed implementation plans |

**Development:**
| Skill | Invoke As | Description |
|-------|-----------|-------------|
| TDD | `superpowers:test-driven-development` | RED → GREEN → REFACTOR cycle |
| Python testing | `python-development:python-testing-patterns` | pytest fixtures and strategies |
| Verification | `superpowers:verification-before-completion` | Run tests before claiming done |
| Systematic debugging | `superpowers:systematic-debugging` | Root cause analysis |

**Git & Review:**
| Skill | Invoke As | Description |
|-------|-----------|-------------|
| Commit | `/commit` | Stage and commit with generated message |
| Commit + PR | `/commit-push-pr` | Full workflow in one step |
| Code review | `/code-review` | Review PR for bugs and quality |
| Clean branches | `/clean_gone` | Remove local branches deleted from remote |

### Slash Commands

Local commands stored in `.claude/commands/`. Project-specific shortcuts.

- `/create-issue` - Create a GitHub issue with proper issue type and add it to the project
- `/work-on-issue` - Start work on a GitHub issue (fetches details, creates branch, follows workflow)

### Agents

Spawn agents for implementation. Use Task tool with `subagent_type`.

**Primary Agents for This Project:**

| Agent | Domain | Use For |
|-------|--------|---------|
| `fastapi-pro` | `src/backend/` | API endpoints, SQLAlchemy models, Pydantic schemas |
| `typescript-pro` | `src/frontend/` | React components, Three.js/R3F, hooks |
| `Explore` | Any | Understanding code patterns, finding files |
| `code-reviewer` | Any | Pre-merge quality review |
| `simple-task` | Any | Single-file fixes, typos, config changes |

**Agent Rules:**
- Backend implementation → spawn `fastapi-pro`
- Frontend implementation → spawn `typescript-pro`
- Multi-file changes → use agents, don't edit directly
- Independent tasks → run multiple agents in parallel
- Before merge → run `code-reviewer`

**Code Review Checklist (Frontend):**
- Check for opportunities to use existing UI components from `components/ui/`
- Identify repeated UI patterns that should become reusable components
- Verify design tokens are used instead of hardcoded colors/spacing

### Browser Automation

Playwright MCP tools are available for UI testing. Key tools: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_console_messages`.

### Workflow Examples

**Adding a New API Endpoint (Backend):**
1. `superpowers:brainstorming` - Clarify requirements
2. `superpowers:writing-plans` - Plan the endpoint, models, tests
3. Spawn `fastapi-pro` agent - Implement in `src/backend/`
4. `superpowers:verification-before-completion` - Run `make test`
5. `/commit-push-pr` - Create PR

**Building a New React Component (Frontend):**
1. `/frontend-design` - Design the component with high visual quality
2. Spawn `typescript-pro` agent - Implement in `src/frontend/`
3. Test in browser (Playwright or manual)
4. `/commit` - Commit changes

**Building a Full-Stack Feature:**
1. `superpowers:brainstorming` - Clarify requirements
2. `superpowers:writing-plans` - Plan both backend and frontend
3. Spawn `fastapi-pro` agent - Implement API in `src/backend/`
4. Spawn `typescript-pro` agent - Implement UI in `src/frontend/`
5. `superpowers:verification-before-completion` - Run all tests
6. `/commit-push-pr` - Create PR

**Fixing a Bug:**
1. `superpowers:systematic-debugging` - Find root cause
2. `superpowers:test-driven-development` - Write failing test
3. Fix the bug
4. `superpowers:verification-before-completion` - Confirm tests pass
5. `/commit` - Commit the fix

## Testing

### Backend Testing

```bash
cd src/backend
make install                 # Install dependencies
make test                    # Run tests with coverage
make lint                    # Run linter
make format                  # Auto-format code
make check                   # Run lint + test
```

**Test Structure:**
- Tests live in `src/backend/tests/`
- Test files: `test_*.py`
- Test functions: `test_*`
- Use fixtures from `conftest.py` for database and client

**Writing Tests:**
- Use `client` fixture for API endpoint tests
- Use `db_session` fixture for direct database tests
- Each test gets a fresh database (SQLite in-memory)
- Tests run in parallel - don't share state between tests

### Frontend Testing

```bash
cd src/frontend
npm install                  # Install dependencies
npm test                     # Run tests with Vitest
npm run lint                 # Run ESLint
npm run build                # Type-check and build
```

**Test Structure:**
- Tests live alongside components or in `__tests__/` directories
- Test files: `*.test.tsx` or `*.test.ts`
- Use React Testing Library for component tests

**Visual Testing:**
- Use Playwright browser automation for E2E tests
- Key tools: `browser_navigate`, `browser_snapshot`, `browser_click`

### What to Test

**Backend:**
- API endpoint responses (status codes, response shape)
- Validation errors (missing fields, invalid data)
- Business logic in services
- Edge cases (empty lists, not found, duplicates)

**Frontend:**
- Component rendering and user interactions
- Form validation and submission
- State management behavior

### What NOT to Test
- Third-party library internals
- Framework internals (routing, lifecycle)
- Browser/driver behavior

## GitHub Issue Management

This project uses GitHub Projects with issue types and parent-child relationships.

### Issue Types

| Type | ID | Use For |
|------|-----|---------|
| Feature | `IT_kwDOD0FvSc4B1b4O` | High-level features (epics) |
| Task | `IT_kwDOD0FvSc4B1b4M` | A specific piece of work |
| Bug | `IT_kwDOD0FvSc4B1b4N` | An unexpected problem or behavior |

> **Note:** User Story type needs to be created in the mssindustries org if needed.

### Project

- **Project Name**: Product Customizer
- **Project Number**: 1
- **Owner**: mssindustries

### Creating Issues with Issue Types

Use GraphQL to create issues with proper issue types:

```bash
# Create a Feature
gh api graphql -f query='
mutation {
  createIssue(input: {
    repositoryId: "R_kgDOQtah4Q"
    title: "Feature Title"
    body: "## Feature: Feature Title\n\nDescription here."
    issueTypeId: "IT_kwDOD0FvSc4B1b4O"
  }) {
    issue { id number title }
  }
}'

# Create a Task with parent
gh api graphql -f query='
mutation {
  createIssue(input: {
    repositoryId: "R_kgDOQtah4Q"
    title: "Task title"
    body: "## Task\n\nDescription.\n\n### Acceptance Criteria\n- [ ] Criteria 1"
    issueTypeId: "IT_kwDOD0FvSc4B1b4M"
    parentIssueId: "PARENT_ISSUE_ID"
  }) {
    issue { id number title parent { number } }
  }
}'
```

### Adding Issues to the Project

After creating an issue, add it to the project:

```bash
gh project item-add 1 --owner mssindustries --url https://github.com/mssindustries/product-customizer/issues/ISSUE_NUMBER
```

### Repository ID

`R_kgDOQtah4Q`

## GitHub Issue Workflow

### Project Statuses

| Status | Purpose |
|--------|---------|
| Backlog | Not started, waiting in queue |
| In Analysis | Exploring/understanding the problem, formatting issue |
| Planning | Creating implementation plan |
| In Development | Writing code |
| Done | Complete |

### Working on Issues

Use `/work-on-issue <number>` to start work on a GitHub issue. This will:
1. Fetch the issue details
2. Create a branch using the naming convention
3. Move the issue to the appropriate status
4. Follow the workflow based on the current status

### Status-Specific Workflow

#### Backlog

When starting work on a backlog issue:
1. Move issue to "In Analysis"
2. Begin analysis process

#### In Analysis

Act as a product owner/business analyst to provide business context, leaving technical implementation details for later.

1. **Format the issue** based on its type (Feature, Task, Bug)
2. **Validate requirements:**
   - Are acceptance criteria clear and complete?
   - Are there ambiguities or missing details?
3. **Ask clarifying questions** if needed
4. **Move to Planning** when the issue is well-defined

#### Planning

1. **Determine plan complexity** (simple vs complex)
2. **Create implementation plan:**
   - **Simple plan:** Files to touch + brief steps
   - **Complex plan:** Architecture overview + detailed TDD tasks
3. **Store plan** in `plans/YYYY-MM-DD-<issue-number>-<slug>.md`
4. **Wait for approval** - do NOT start coding
5. Move to In Development only after approval

#### In Development

1. **Check for existing work** (branches/PRs related to this issue)
2. **Follow the plan** if one exists
3. **Use TDD for code changes:**
   - Write test → make it pass → commit
4. **Adapt with judgment:**
   - Small adaptations are fine
   - Significant deviations → stop and ask
5. **Push to branch, open PR when done**

### Plan Formats

Plans are stored in `plans/` with naming: `YYYY-MM-DD-<issue-number>-<slug>.md`

#### Simple Plan Format

```markdown
# [Issue Title]

**Issue:** #123
**Domain:** frontend, backend, infrastructure (list all that apply)

## Files to Modify
- `path/to/file` - description of changes

## Steps
1. Step one
2. Step two

## Verification
- How to verify the changes work
```

#### Complex Plan Format

```markdown
# [Issue Title] Implementation Plan

**Issue:** #123
**Domain:** frontend, backend, infrastructure (list all that apply)

**Goal:** One sentence describing what this builds

**Architecture:** How components fit together, data flow

---

## Task 1: [Component Name]

**Files:**
- Create: `path/to/new`
- Modify: `path/to/existing`
- Test: `path/to/test`

**TDD Steps:**
1. Write failing test
2. Run test (expect RED)
3. Implement minimal code
4. Run test (expect GREEN)
5. Refactor if needed
6. Commit

---

## Verification
- End-to-end testing steps
```

### Domain-Specific Guidance

When working on an issue, identify the domain and follow the appropriate guidance.

#### Frontend (`src/frontend/`)

**Tools & Commands:**
- Agent: `typescript-pro`
- Design: `/frontend-design`
- Test: `cd src/frontend && npm test`
- Lint: `cd src/frontend && npm run lint`
- Dev server: `cd src/frontend && npm run dev`

**Testing Approach:**
- Component tests with Vitest + React Testing Library
- Visual testing with Playwright browser automation
- Test files: `*.test.tsx` or `*.test.ts`

**Key Patterns:**
- React Three Fiber for 3D rendering
- Tailwind CSS v4 for styling
- React Router for navigation

**UI Components:**
When building UI:
1. First explore existing components in `src/frontend/src/components/ui/`
2. Use design tokens from `index.css` (colors: primary, neutral, success, warning, danger)
3. If a pattern repeats 2+ times, extract it to a reusable component
4. Use CVA (class-variance-authority) for component variants

**Data Fetching:**
Use custom hooks from `src/frontend/src/hooks/` to eliminate repeated fetch-loading-error patterns:
- `useList()` - For API endpoints returning `{ items: T[], total: number }`
- `useAsync()` - For general async operations

```tsx
// Example: Fetching a list
const { items: clients, isLoading, error, refetch } = useList(getClients);

// Example: Custom async operation
const { data, isLoading, error, execute } = useAsync(
  async () => await fetchUser(userId),
  { immediate: false }
);
```

#### Backend (`src/backend/`)

**Tools & Commands:**
- Agent: `fastapi-pro`
- Test: `cd src/backend && make test`
- Lint: `cd src/backend && make lint`
- Format: `cd src/backend && make format`
- Full check: `cd src/backend && make check`

**Testing Approach:**
- pytest with async support
- Use `client` fixture for API tests
- Use `db_session` fixture for database tests
- Test files: `test_*.py`

**Key Patterns:**
- FastAPI async endpoints
- SQLAlchemy 2.0 async ORM
- Pydantic v2 for validation
- Repository pattern for data access (eliminates "get or 404" duplication)
- Response schema factory methods (eliminates manual field mapping)

**Repository Pattern:**
The codebase uses a repository pattern to eliminate duplicated data access logic:
- Use `EntityRepository.ensure_exists(id)` instead of manual SELECT + None check
- Raises `EntityNotFoundError` which is caught by global exception handler
- Example: `product = await ProductRepository(db).ensure_exists(product_id)`
- Repositories are in `app/repositories/` - check there for available entity repositories

**Response Schema Factory Methods:**
All response schemas have `from_model()` and `from_models()` class methods for ORM-to-schema conversion:
- Use `ResponseSchema.from_model(orm_instance)` for single objects
- Use `ResponseSchema.from_models(orm_sequence)` for collections (accepts `Sequence[T]` from SQLAlchemy)
- Example: `return ProductResponse.from_model(product)` instead of manual field mapping
- Benefits: single source of truth, eliminates typos, easier maintenance when schemas change

#### Multi-Domain (e.g., frontend + backend)

When an issue spans multiple domains:

1. **Plan both domains** in a single plan file
2. **Implement backend first** (API, models, validation)
3. **Implement frontend second** (components, API calls)
4. **Verify integration** with end-to-end testing

#### Infrastructure

**Tools & Commands:**
- Docker Compose for local dev
- Azure CLI for cloud resources
- Bicep for Azure IaC

**Key Files:**
- `docker-compose.yml` - local services
- `.github/workflows/` - CI/CD pipelines
- `infra/` - Bicep modules and parameter files
- `docs/naming-conventions.md` - Azure resource naming

**Bicep Guidelines:**
- Always verify latest stable API version for each resource type before writing modules
- Follow naming conventions in `docs/naming-conventions.md`

**Finding Latest API Versions:**
```bash
# Get available API versions for a resource type (newest first)
az provider show \
  --namespace <PROVIDER> \
  --query "resourceTypes[?resourceType=='<TYPE>'].apiVersions | [0]" \
  --out table

# Examples:
az provider show --namespace Microsoft.ContainerRegistry --query "resourceTypes[?resourceType=='registries'].apiVersions | [0]" --out table
az provider show --namespace Microsoft.App --query "resourceTypes[?resourceType=='containerApps'].apiVersions | [0]" --out table
az provider show --namespace Microsoft.ManagedIdentity --query "resourceTypes[?resourceType=='userAssignedIdentities'].apiVersions | [0]" --out table
```

**Common Resource Providers:**
- `Microsoft.ContainerRegistry` - Container registries
- `Microsoft.App` - Container Apps
- `Microsoft.Storage` - Storage accounts
- `Microsoft.DBforPostgreSQL` - PostgreSQL servers
- `Microsoft.ManagedIdentity` - Managed identities
- `Microsoft.Web` - Static Web Apps

**Reference:** https://learn.microsoft.com/en-us/azure/templates/

## Branch Naming Guidelines

See the [Branch Naming Guidelines in README.md](README.md#branch-naming-guidelines) for the current branch naming conventions.

**Quick summary:**
- `issue/{number}-description` - issue-based work
- `test/description` - experiments and testing
- `fix/description` - hotfixes
- `chore/description` - non-feature work
