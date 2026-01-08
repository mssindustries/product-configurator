# MSS Industries Product Configurator

## Overview

A B2B 3D product configurator platform. Clients (manufacturers of custom products like cabinets, fireplace covers, range hoods) use this to show their customers real-time 3D visualizations of customizable products.

## Users

- **Clients**: Businesses that manufacture custom products. They configure what products/options are available.
- **Customers**: End users who view and customize products, then save their preferences.
 - [note] the customer will only view the product while sitting with the client, or the client may send them a picture or something. The customer never needs to login.

## Tech Stack

- **Framework**: Next.js (App Router)
- **3D Rendering**: React Three Fiber + Three.js
- **Database**: SQLite + Prisma (simple, single-file, can migrate to Postgres later)
- **Language**: TypeScript
- **Deployment**: Single container (Docker) or Vercel

## Features

### Phase 1 - MVP
- [ ] Basic 3D viewer with orbit controls
- [ ] Load and display a sample 3D model (GLTF/GLB format)
- [ ] Simple customization UI (e.g., change color, material)
- [ ] Real-time model updates based on selections
- [ ] Save configuration to database
- [ ] Basic customer info capture (name, email)
- [ ] Link saved config to customer

### Phase 2 - Client Management
- [ ] Client accounts (the businesses)
- [ ] Client can upload/manage their product models
- [ ] Client can define customization options per product
- [ ] Customer configs scoped to client

### Phase 3 - Polish
- [ ] Better materials/lighting/environment
- [ ] Configuration sharing (unique URLs)
- [ ] PDF/image export of configured product
- [ ] Pricing display (optional per client)

## Data Model (Initial)

```
Client (the business)
  - id
  - name
  - email

Product (belongs to Client)
  - id
  - clientId
  - name
  - modelUrl (GLTF/GLB file)
  - options (JSON - available customizations)

Configuration (a saved customer customization)
  - id
  - productId
  - customerName
  - customerEmail
  - selections (JSON - chosen options)
  - createdAt
```

## Open Questions

- [ ] How will clients upload 3D models? (Admin UI vs manual upload)
- [ ] What customization types to support first? (color, material, dimensions, parts)
- [ ] Authentication needed for clients? (Phase 2 concern)
- [ ] Where to host? (Vercel, Railway, self-hosted Docker)

## Technical Notes

- Using React Three Fiber (R3F) instead of raw Three.js for React integration
- GLTF/GLB is the standard format for web 3D - clients will need models in this format
- drei library provides helpful R3F utilities (controls, loaders, etc.)
