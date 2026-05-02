# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (tsc + vite build)
npm run lint         # ESLint on all TS/TSX files
npm run typecheck    # tsc --noEmit (type-check without emitting)
npm run preview      # Preview the production build locally
```

There is no test framework configured.

## Architecture

**React + TypeScript SPA** for Indian wedding planning, backed by Supabase (PostgreSQL + Auth + Edge Functions). Styled entirely with Tailwind CSS utility classes.

### App flow

```
main.tsx
  └── AuthProvider (src/contexts/AuthContext.tsx)
        └── App.tsx  — three conditional views:
              ├── <Auth />         — not logged in
              ├── <WeddingSetup /> — logged in, no wedding row yet
              └── <Dashboard />    — logged in + wedding exists
```

- `AuthContext` handles Supabase Auth (login, signup, session) and calls the `confirm-email` Edge Function on signup to auto-confirm users.
- `useWedding` (`src/hooks/useWedding.ts`) fetches the user's single `weddings` row and exposes a `refresh()` callback; it is the main data-loading hook passed down through Dashboard.
- `Dashboard.tsx` is a tabbed shell. Each tab (Overview, Guests, Budget, Vendors, Checklist) is a separate component that receives the `wedding` object and a `refresh` callback; they perform their own Supabase CRUD directly.

### Database (Supabase / PostgreSQL)

Schema is in `supabase/migrations/20260307230826_create_wedding_app_schema.sql`. Six tables, all behind Row-Level Security tied to `auth.uid()`:

| Table | Purpose |
|---|---|
| `weddings` | One row per user; core metadata (partner names, date, venue, budget, target guest count) |
| `guests` | Guest list; RSVP status (`pending`/`accepted`/`declined`), plus-ones, dietary |
| `budget_categories` | Named groupings (e.g. Venue, Catering) with allocated amounts |
| `budget_items` | Line-item expenses linked to a category; estimated vs. actual cost |
| `vendors` | Vendor contact details, cost, payment status, contract tracking |
| `checklist_items` | Planning tasks with due date, priority, and completion flag |

### Edge Functions

`supabase/functions/confirm-email/index.ts` — Deno-based function called from `AuthContext` after signup. Auto-confirms the email so users can log in immediately without an email verification step.

### Environment variables

Two env vars must exist in a local `.env` file (not committed):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The Supabase client is initialized once in `src/lib/supabase.ts` and imported wherever DB access is needed.

### Currency

All monetary values are displayed in Indian Rupees (₹). Use `toLocaleString('en-IN')` for formatting, consistent with the rest of the codebase.
