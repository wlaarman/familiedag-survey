# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Dutch family quiz survey ("Familiequiz") for collecting family information, deployed on Vercel. Next.js 16 App Router with TypeScript, Neon Postgres via `@vercel/postgres`, Vercel Blob for photos, Tailwind CSS v4. UI text is in Dutch, commit messages in English.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

Scripts run with `node --env-file=.env.local scripts/<script>.mjs`.

## Architecture

### Survey Flow

7-step wizard (`src/components/SurveyWizard.tsx`) collecting person info, partner details (conditional on `heeft_partner`), work/education, childhood memories, hobbies, favorites, and "this or that" preferences. Form state persists in sessionStorage. Submits to `/api/submit`, photos via `/api/upload`.

### Admin Panel

Password-protected dashboard at `/admin` (`src/components/admin/AdminDashboard.tsx`) with **10 tabs**: responses, overview, statistics, photos, anekdotes, feitjes, logoquiz, straatquiz, cijferquiz, wievande3. Login via `/admin/login`, session tokens in `admin_sessions` table.

### Quiz Rounds

All quiz pages are server components (except shared `PrintButton.tsx`) that auto-generate from the database. Each supports `?mode=quiz` and `?mode=antwoorden` URL params.

| Quiz | Route | Logic | Description |
|------|-------|-------|-------------|
| Raad de Straat | `/admin/quiz/straat` | DB `streetview_quiz` table | Streetview photos, guess who lives there. Normal + hard (wider angle, no house numbers) variants |
| Wie is Wie? | `/admin/quiz/fotos` | DB portrait photos | Portrait photos, guess the name. Color + grayscale (CSS filter) variants |
| Cijferronde | `/admin/quiz/cijfers` | `src/lib/quiz-questions.ts` | Auto-generated numeric questions from survey data (ages, shoe sizes, wedding dates, etc.) |
| Wie van de 3? | `/admin/quiz/wie-van-de-3` | `src/lib/quiz-wie-van-de-3.ts` | 3 names shown, guess who matches the fact. Sources: vakantielanden, angsten, gerechten, sport, bijnamen, etc. Max 15 questions |

### API Routes

- `POST /api/submit` - Save survey response
- `POST /api/upload` - Upload photo to Vercel Blob
- `GET/DELETE /api/responses` - Admin: list/delete responses
- `POST /api/auth` - Admin login/logout
- `GET /api/logos` - Get custom logos for logo quiz
- `GET /api/quiz/streetview` - Get streetview quiz items

### Database

Three main tables in Neon Postgres (`src/lib/db.ts`):
- **`survey_responses`** - 60+ columns, person 1 & 2 fields suffixed `_1`/`_2`. Auto-migration for new columns.
- **`streetview_quiz`** - Streetview photos with `blob_url` (normal) and `blob_url_hard` (hard variant)
- **`custom_logos`** - Custom logo overrides for the logo quiz

## Key Patterns

- Partner fields only shown when `heeft_partner` is true
- Photos can be uploaded or marked "send later" (`foto_X_later` boolean)
- CSV export includes UTF-8 BOM for Excel compatibility
- Quiz pages use `@media print` + `print:` Tailwind classes for print-friendly output
- Shared `PrintButton` at `src/app/admin/quiz/straat/PrintButton.tsx` is reused by all quiz pages

## Scripts

- `upload-local-photos.mjs` - Bulk upload photos from local disk to Blob, link to DB records
- `upload-streetview-to-blob.mjs` - Upload streetview photos to Blob
- `_download-hard-variant.mjs` - Download hard variant streetview photos (fov=100, stripped house numbers)
- `download-streetview.mjs` - Download Google Street View images (requires `GOOGLE_MAPS_API_KEY`)

## Environment Variables

- `POSTGRES_URL` - Neon database connection
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `ADMIN_PASSWORD` - Admin panel password

## Deployment

Push to `main` branch auto-deploys to Vercel.
