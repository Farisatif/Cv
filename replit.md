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
- **Description**: An interactive CV/resume site with a teal/emerald "Signal" aesthetic, bilingual EN/AR support, and 3 mood themes (Cosmic, Night, Light).
- **Data**: All CV content lives in `src/data/resume.json` — edit this to update any information.
  - Bilingual structure: `en` and `ar` sub-objects for each translatable field.
  - Skills have `category_en` and `category_ar`.
  - Projects have `tags_en`, `tags_ar`, and `en`/`ar` descriptions.
- **Translations**: UI strings in `src/data/translations.ts` (both languages).
- **Language context**: `src/context/LanguageContext.tsx` — RTL/LTR support, persisted to localStorage.
- **PDF download**: `src/lib/downloadPDF.ts` — pure jsPDF (no html2canvas): all CV sections, bilingual labels, skill bars, pagination, footer.
- **Admin split**: `pages/admin/` subfolder — adminShared, PersonalTab, SkillsTab, ExperienceTab, ProjectsTab, EducationTab, LanguagesTab, AchievementsTab, CommentsTab, SettingsTab. AdminPanel.tsx is a 130-line shell.
- **Features**:
  - Bilingual EN/AR with RTL layout support (globe icon + ع/E badge in navbar)
  - PDF download (pure jsPDF): full sections, bilingual, skill bars, pagination
  - Premium design system: `cosmic-card`, `premium-card`, `highlight-card`, `btn-primary`, `btn-secondary`, `cosmic-input`, `section-label`
  - Space Grotesk + Inter + Noto Sans Arabic typography
  - Animated particle background on hero with twinkling + constellation lines
  - Achievement chips on hero (years coding, commits, repos)
  - Typewriter effect for role titles (bilingual)
  - Animated stat counters (count-up on scroll)
  - Skills grid: animated scroll-triggered cards with stagger delay, per-skill color-coded progress bars, category filter tabs, level stats legend
  - Interactive language bar with draggable dividers
  - Real GitHub contribution graph for Farisatif (fetched via API, falls back to generated); scroll-driven emerald circular glow
  - Real GitHub stats (followers, repos, stars) in contribution section
  - Scroll-reveal animations on all sections with stagger children
  - Accordion experience timeline with company initials avatars + duration badges
  - Project cards (first featured full-width) with language dot + star/fork counts
  - New AchievementsSection with 6 highlight cards + accent colors (id: `achievements`)
  - 3 site moods: Cosmic (deep navy + teal/emerald glow), Night (pitch-black, data-mood="dark"), Light (clean white)
  - Sticky navbar with active section tracking + "Highlights" nav item
  - Multi-section footer with quick links + connect section
  - Guestbook backed by PostgreSQL (comments + likes + char counter + trust signals)
  - Live visitor counter (session-deduplicated)
  - Admin panel with premium field styling (cosmic-input)
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
- **Auth routes**: `/api/auth/login` (password), `/api/auth/google`, `/api/auth/verify`, `/api/auth/logout`, `/api/auth/change-password`
- **Admin routes**: `/api/admin/stats` — visitor count, comment counts, DB status, last save time
- **Security**: Admin comment endpoints accept either `X-Admin-Key` or `X-Session-Token` headers
- **Startup**: Runs 14 idempotent schema migrations via `src/lib/migrations.ts` before seeding
- **Default admin**: username `admin`, password `Zoom100*` (bcrypt-hashed in DB)
- **DB schema**: `admin_sessions` columns: `id`, `google_id` (unique), `email`, `name`, `session_token`, `expires_at`, `created_at`
- **DB schema**: `admin_credentials` columns: `id`, `username` (unique), `password_hash`, `created_at`, `updated_at`

## Admin Panel
- Located at `/admin` (login required)
- Default credentials: username `admin`, password `Zoom100*`
- 9 tabs with icons: Personal, Skills, Experience, Projects, Education, Languages, Achievements, Comments, Settings
- **Settings tab**: account info, site statistics (visitors/comments/DB status), change password
- **Comments tab**: approve/delete pending comments using session token authentication
- **Security**: Session tokens stored in `sessionStorage` and sent via `X-Session-Token` header

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
