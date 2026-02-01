# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Dutch family quiz survey ("Familiequiz") for collecting family information, deployed on Vercel. Next.js 16 App Router with TypeScript, Neon Postgres via `@vercel/postgres`, Vercel Blob for photos, Tailwind CSS v4.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

**Survey Flow**: 7-step wizard (`SurveyWizard.tsx`) collecting person info, partner details (conditional), work/education, childhood memories, hobbies, favorites, and "this or that" preferences. Form state persists in sessionStorage.

**Admin Panel**: Password-protected dashboard at `/admin` with 4 tabs: responses table, statistics, photo gallery, and anekdotes. Login via `/admin/login`, session tokens stored in `admin_sessions` table.

**API Routes**:
- `POST /api/submit` - Save survey response
- `POST /api/upload` - Upload photo to Vercel Blob
- `GET/DELETE /api/responses` - Admin: list/delete responses
- `POST /api/auth` - Admin login/logout

**Database**: Single `survey_responses` table with 60+ columns (person 1 & 2 fields suffixed `_1`/`_2`). Schema in `src/lib/db.ts` includes auto-migration for new columns.

## Key Patterns

- Partner fields only shown when `heeft_partner` is true
- Photos can be uploaded or marked "send later" (`foto_X_later` boolean)
- CSV export includes UTF-8 BOM for Excel compatibility
- Response detail view opens in new tab from admin

## Environment Variables

- `POSTGRES_URL` - Neon database connection
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `ADMIN_PASSWORD` - Admin panel password

## Uploading Local Photos

Photos from `C:\Users\WillemLaarman\iCloudDrive\Verbouwing\Familiedag\foto` can be bulk-uploaded to Vercel Blob and linked to database records:

```bash
node --env-file=.env.local scripts/upload-local-photos.mjs
```

To add new photo mappings, edit `scripts/upload-local-photos.mjs` and add to `MAPPINGS`:
```javascript
{ pattern: /^bestandsnaam\.jpeg$/i, id: XX, field: 'foto_1_url', name: 'Naam' },
```
- `foto_1_url` = persoon 1, `foto_2_url` = partner
- Script skips photos that already exist in database

## Deployment

Push to `main` branch auto-deploys to Vercel.
