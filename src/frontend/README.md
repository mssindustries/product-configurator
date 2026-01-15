# MSS Industries Product Configurator - Frontend

React + TypeScript + Vite + Tailwind CSS v4

## Features

- React 18 with TypeScript
- Vite for fast dev server and optimized builds
- React Three Fiber for 3D rendering
- React Router for client-side routing
- Tailwind CSS v4 for styling
- Path aliases (`@/` → `src/`)

## Getting Started

### Install dependencies
```bash
npm install
```

### Start dev server (port 5173)
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Project Structure

```
src/frontend/
├── public/           # Static assets
├── src/
│   ├── components/   # React components
│   ├── context/      # React Context providers
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and helpers
│   ├── pages/        # Route page components
│   ├── services/     # API client functions
│   ├── types/        # TypeScript type definitions
│   ├── App.tsx       # Root component
│   ├── main.tsx      # Entry point
│   └── index.css     # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Configuration

- **Vite**: `vite.config.ts` - path aliases, dev server port
- **TypeScript**: `tsconfig.json` - strict mode enabled
- **Tailwind**: `src/index.css` - using @import directive for v4

## Environment Variables

Create a `.env` file for environment-specific configuration:

```
VITE_API_URL=http://localhost:8000
```
