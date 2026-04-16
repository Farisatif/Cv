# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### cv-resume (Interactive CV/Resume)
- **Type**: react-vite, preview at `/`
- **Directory**: `artifacts/cv-resume/`
- **Description**: A GitHub-inspired black & white interactive CV/resume site.
- **Features**:
  - Animated particle background on hero
  - Typewriter effect for role titles
  - Animated stat counters
  - Draggable skill badges with physics-based drop behavior (level resets when dropped)
  - Interactive language bar with draggable dividers
  - Animated contribution graph (reveals cell-by-cell on scroll)
  - Scroll-reveal animations on all sections
  - Accordion experience timeline
  - Project cards with hover effects
  - Dark/light mode toggle
  - Sticky navbar with active section tracking

### mockup-sandbox (Canvas / Design Sandbox)
- **Type**: design, preview at `/__mockup`
- **Directory**: `artifacts/mockup-sandbox/`

### api-server (API Server)
- **Type**: api, preview at `/api`
- **Directory**: `artifacts/api-server/`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
