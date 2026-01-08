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

## Development Phases

### Phase 1 - MVP (Current)
Basic 3D viewer, simple customization UI, save configurations, customer info capture

### Phase 2 - Client Management
Client accounts, model uploads, customization option management

### Phase 3 - Polish
Better materials/lighting, configuration sharing, PDF/image export, pricing display

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

## Architecture Notes

- Using React Three Fiber (R3F) instead of raw Three.js for React integration
- Clients will need 3D models in GLTF/GLB format
- Customization options stored as JSON (flexible schema for different product types)

## Development Preferences
- USE pnpm.