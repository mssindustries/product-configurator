# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MSS Industries Product Configurator - A B2B 3D product configurator platform for manufacturers of custom products (cabinets, fireplace covers, range hoods, etc.). Allows businesses to show customers real-time 3D visualizations of customizable products.

## Tech Stack

- **Framework**: Next.js (App Router)
- **3D Rendering**: React Three Fiber + Three.js
- **Database**: SQLite + Prisma (single-file database, can migrate to Postgres later)
- **Language**: TypeScript
- **3D Format**: GLTF/GLB (standard web 3D format)
- **Utilities**: drei library for R3F helpers (controls, loaders, etc.)
- **Deployment**: Single container (Docker) or Vercel

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

**nextjs-developer** - Next.js implementation
- Use for: In-development phase of feature workflow
- Examples: Implementing features, creating components, building API routes
- When: Feature moved to `features/in-development/`, ready to code
- Best practices: Follows Next.js 14+ App Router patterns, server components, server actions

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
2. **Analysis → Development**: Use `nextjs-developer` to implement
3. **Development → Review**: Use `code-reviewer` before merge
4. **Throughout**: Use `Explore` to understand codebase, `simple-task` for quick fixes

**Ad-hoc Tasks:**
- Small fix needed? → `simple-task`
- Don't understand code? → `Explore`
- Need to plan approach? → `Plan` or EnterPlanMode
- Need to run commands? → `Bash`