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
- **Description**: A GitHub-inspired black & white interactive CV/resume site with bilingual EN/AR support.
- **Data**: All CV content lives in `src/data/resume.json` — edit this to update any information.
  - Bilingual structure: `en` and `ar` sub-objects for each translatable field.
  - Skills have `category_en` and `category_ar`.
  - Projects have `tags_en`, `tags_ar`, and `en`/`ar` descriptions.
- **Translations**: UI strings in `src/data/translations.ts` (both languages).
- **Language context**: `src/context/LanguageContext.tsx` — RTL/LTR support, persisted to localStorage.
- **PDF download**: `src/lib/downloadPDF.ts` — html2canvas + jspdf.
- **Features**:
  - Bilingual EN/AR with RTL layout support (toggle in navbar)
  - PDF download via html2canvas + jspdf
  - Skills badges freely accessible (no scroll restriction)
  - Animated particle background on hero
  - Typewriter effect for role titles (bilingual)
  - Animated stat counters
  - Draggable skill badges with physics-based drop behavior
  - Interactive language bar with draggable dividers
  - Real GitHub contribution graph for Farisatif (fetched via API, falls back to generated)
  - Real GitHub stats (followers, repos, stars) in contribution section
  - Green-shaded contribution cells (GitHub-style colors)
  - Scroll-reveal animations on all sections
  - Accordion experience timeline
  - Project cards with hover effects
  - System dark/light mode — pure white light / true black dark
  - Sticky navbar with active section tracking
  - Guestbook backed by PostgreSQL (comments + likes)
  - Live visitor counter (session-deduplicated)
  - Admin panel at `/cv-resume/admin` with password "Zoom100*"
    - Add/edit/delete: skills, experience, projects, education, personal info
    - Changes stored to localStorage; accessible via ⚙ gear icon in footer
  - Arabic/RTL formatting fixes: images, SVGs, and numbers stay LTR inside RTL layout

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
