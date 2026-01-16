# Familiedag Survey - Project Knowledge

## Overview
A Dutch family quiz survey ("Familiequiz") for collecting family information, deployed on Vercel.

## Tech Stack
- **Framework**: Next.js 14 with App Router, TypeScript
- **Database**: Neon (serverless Postgres) via `@vercel/postgres`
- **File Storage**: Vercel Blob for photo uploads
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (auto-deploys from GitHub)

## Repository
- GitHub: `wlaarman/familiedag-survey`
- Main branch: `main`

## Key URLs
- Survey: https://familiedag-survey.vercel.app (or custom domain if configured)
- Admin: /admin (password protected via ADMIN_PASSWORD env var)
- Admin login: /admin/login

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Main survey page
│   ├── bedankt/page.tsx            # Thank you page after submission
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── login/page.tsx          # Admin login
│   │   └── response/[id]/page.tsx  # Response detail view
│   └── api/
│       ├── submit/route.ts         # Submit survey response
│       ├── upload/route.ts         # Upload photo to Vercel Blob
│       ├── responses/route.ts      # Get/delete responses (admin)
│       └── auth/route.ts           # Admin authentication
├── components/
│   ├── survey/
│   │   ├── SurveyWizard.tsx        # Main 7-step wizard
│   │   ├── ProgressBar.tsx         # Step progress indicator
│   │   └── PhotoUpload.tsx         # File upload with "send later" option
│   └── admin/
│       └── AdminDashboard.tsx      # Admin table view
├── lib/
│   ├── db.ts                       # Database functions
│   ├── auth.ts                     # Session authentication
│   └── blob.ts                     # Vercel Blob helpers
└── types/
    └── survey.ts                   # TypeScript interfaces
```

## Survey Steps (7 total)
1. **Persoon 1** - Name, birthdate, address, photo upload
2. **Partner** - Yes/No toggle, partner details if yes
3. **Werk & Studie** - Marriage status, jobs, education
4. **Jeugd** - Elementary school, nicknames, side jobs
5. **Huisdieren & Hobby's** - Pets, sports, music, volunteer work
6. **Favorieten & Weetjes** - Vacation, food, drinks, fears, anecdote
7. **Dit of dat?** - Preference choices (coffee/tea, summer/winter, etc.)

## Key Features
- Multi-step wizard with validation
- Conditional fields (partner info only shown if has partner)
- Photo upload with "send later via app" option
- Form data persisted in sessionStorage (survives refresh/navigation)
- Browser back button navigates to previous step
- Scroll to top on step change
- Admin dashboard with CSV export
- Response detail page opens in new tab

## Environment Variables (Vercel)
- `POSTGRES_URL` - Neon database connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `ADMIN_PASSWORD` - Admin panel password

## Database Tables
- `survey_responses` - All survey data with 60+ columns
- `admin_sessions` - Session tokens for admin auth

## Recent Changes
- Photos in admin clickable to view full size
- Single person layout uses full width
- "Send later" option hidden when photo already uploaded
- Date input fields smaller on mobile
- Partner field labels shortened

## Development
```bash
cd C:\Sandbox\familiedag-survey
npm run dev
# Opens at http://localhost:3000
```

## Deployment
Push to `main` branch auto-deploys to Vercel.
