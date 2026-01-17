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

### Specialized Agents

This project uses specialized agents for different types of tasks. Choose the right agent based on the task complexity and phase of work.

#### Agent Selection Guide

**simple-task** - Simple, straightforward changes
- Use for: Bug fixes, typos, small edits, single-file changes
- Examples: Fix typo in component, update configuration value, add missing prop
- When: Task is clear, no architectural decisions needed 
- Avoid: Multi-file changes, new features, architectural decisions

**Explore** - Fast codebase exploration
- Use for: Understanding code structure, finding files, answering "where/how" questions
- Examples: "Where are errors handled?", "How does authentication work?", "Find all API routes"
- When: Need to understand codebase before planning or implementing
- Thoroughness levels: "quick" (basic search), "medium" (moderate), "very thorough" (comprehensive)

**Plan** - Implementation planning
- Use for: Designing approach before implementation
- Examples: Planning new feature architecture, refactoring strategy, integration approach
- When: Non-trivial implementation that needs approval before coding
- Note: Often better to use EnterPlanMode directly instead of Plan agent

**architect-reviewer** - Architecture review and analysis
- Use for: In-analysis phase of feature workflow
- Examples: Evaluating feature architecture, identifying risks, reviewing system design
- When: Feature moved to `features/in-analysis/`, need architectural validation
- Outputs: Architecture review in feature spec Planning section

**python-development agents** - Backend implementation
- Use for: FastAPI backend development, API routes, database models
- Examples: Creating API endpoints, SQLAlchemy models, Pydantic schemas
- When: Working on `src/backend/` code
- Available: `fastapi-pro`, `python-pro`, `django-pro` (use fastapi-pro for this project)

**javascript-typescript agents** - Frontend implementation
- Use for: React/Vite frontend development, components, hooks
- Examples: Creating React components, API client, state management
- When: Working on `src/frontend/` code
- Available: `typescript-pro`, `javascript-pro`

**code-reviewer** - Code quality review
- Use for: Before merging feature to main
- Examples: Security review, performance check, best practices validation
- When: Feature status is `in-review`, implementation complete
- Outputs: Code review feedback in feature spec Code Review section

**prompt-engineer** - Prompt optimization
- Use for: Creating prompts that are clear for other sub-agents
- Examples: Refining user prompts, designing prompts to be given to other agents
- When: Feature prompts are vague or needs better structure to optimize token usage

**business-analyst** - Requirements and issue refinement
- Use for: Refining requirements, analyzing business needs, reviewing issue specifications
- Examples: Cleaning up draft issues, removing technical implementation details, ensuring user stories are clear
- When: Need to refine requirements before technical planning begins
- Important: Keep user stories and acceptance criteria **implementation-agnostic**. Remove specific technical details (frameworks, libraries, file paths, code examples). Focus on business value and user needs, not how to implement.

**general-purpose** - Research and complex searches
- Use for: Multi-step research, complex codebase searches
- Examples: Finding patterns across many files, researching best approaches
- When: Task requires multiple search rounds or complex investigation

**Bash** - Terminal operations
- Use for: Git operations, running commands, build tasks
- Examples: Running tests, checking git status, installing dependencies
- When: Need to execute shell commands
- Avoid: File operations (use Read/Edit/Write tools instead)

#### Workflow Integration

**Feature Development Flow:**
1. **Backlog → Analysis**: Use `architect-reviewer` to review architecture
2. **Analysis → Development**: Use `fastapi-pro` (backend) or `typescript-pro` (frontend) to implement
3. **Development → Review**: Use `code-reviewer` before merge
4. **Throughout**: Use `Explore` to understand codebase, `simple-task` for quick fixes

**Ad-hoc Tasks:**
- Small fix needed? → `simple-task`
- Don't understand code? → `Explore`
- Need to plan approach? → `Plan` or EnterPlanMode
- Need to run commands? → `Bash`

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