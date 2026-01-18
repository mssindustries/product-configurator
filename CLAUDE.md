# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MSS Industries Product Configurator - A B2B 3D product configurator platform for manufacturers of custom products (cabinets, fireplace covers, range hoods, etc.). Allows businesses to show customers real-time 3D visualizations of customizable products.

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
- **Deployment**: Azure Static Web Apps (frontend) + Azure Container Instances (backend)
- **3D Format**: GLTF/GLB

## Plugins & Automation

This project uses Claude Code plugins. Use them proactively, not as a last resort.

### Quick Reference

| Task | Command/Agent | Notes |
|------|---------------|-------|
| Start new feature | `/feature-dev` | Guided workflow with architecture focus |
| Design React UI | `/frontend-design` | High-quality, distinctive interfaces |
| Create commit | `/commit` | Auto-generates message from changes |
| Commit + PR | `/commit-push-pr` | Full workflow in one step |
| Review PR | `/code-review` | Structured quality review |
| Debug issue | `/systematic-debugging` | 4-phase root cause analysis |
| Write tests first | `/test-driven-development` | RED-GREEN-REFACTOR cycle |
| Backend work | `fastapi-pro` agent | FastAPI endpoints, SQLAlchemy models |
| Frontend work | `typescript-pro` agent | React components, hooks |
| Explore code | `Explore` agent | Fast codebase search |

### Skills (Slash Commands)

Invoke with `/skillname` for guided workflows.

**Planning:**
- `/brainstorming` - Refine ideas before implementation (use before any creative work)
- `/writing-plans` - Create detailed implementation plans with file paths
- `/feature-dev` - Guided feature development with codebase awareness

**Development:**
- `/frontend-design` - Create distinctive React UIs (use for `src/frontend/` components)
- `/test-driven-development` - Write failing test → make it pass → refactor
- `/python-testing-patterns` - pytest fixtures and testing strategies for `src/backend/`

**Git & Review:**
- `/commit` - Stage changes and create commit with generated message
- `/commit-push-pr` - Commit, push, and open PR in one command
- `/code-review` - Review PR for bugs, security, code quality
- `/clean_gone` - Remove local branches deleted from remote

**Debugging:**
- `/systematic-debugging` - Root cause analysis before proposing fixes
- `/verification-before-completion` - Run tests/checks before claiming done

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

### Browser Automation

Playwright MCP tools are available for UI testing. Key tools: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_console_messages`.

### Workflow Examples

**Adding a New API Endpoint:**
1. `/brainstorming` - Clarify requirements
2. `/writing-plans` - Plan the endpoint, models, tests
3. Spawn `fastapi-pro` agent - Implement in `src/backend/`
4. `/verification-before-completion` - Run `make test`
5. `/commit-push-pr` - Create PR

**Building a New React Component:**
1. `/frontend-design` - Design the component with high visual quality
2. Spawn `typescript-pro` agent - Implement in `src/frontend/`
3. Test in browser (Playwright or manual)
4. `/commit` - Commit changes

**Fixing a Bug:**
1. `/systematic-debugging` - Find root cause
2. `/test-driven-development` - Write failing test in `src/backend/tests/`
3. Fix the bug
4. `/verification-before-completion` - Confirm `make test` passes
5. `/commit` - Commit the fix

## Testing

### Running Tests
```bash
cd src/backend
make install                 # Install dependencies
make test                    # Run tests with coverage
make lint                    # Run linter
make format                  # Auto-format code
make check                   # Run lint + test
```

### Test Structure
- Tests live in `src/backend/tests/`
- Test files: `test_*.py`
- Test functions: `test_*`
- Use fixtures from `conftest.py` for database and client

### Writing Tests
- Use `client` fixture for API endpoint tests
- Use `db_session` fixture for direct database tests
- Each test gets a fresh database (SQLite in-memory)
- Tests run in parallel - don't share state between tests

### What to Test
- API endpoint responses (status codes, response shape)
- Validation errors (missing fields, invalid data)
- Business logic in services
- Edge cases (empty lists, not found, duplicates)

### What NOT to Test
- Third-party libraries (SQLAlchemy, Pydantic)
- Framework internals (FastAPI routing)
- Database driver behavior