# ExerciseInsight

ExerciseInsight is a full-stack fitness tracking app built with Next.js, TypeScript, Tailwind CSS, and Supabase. It helps users build programs, start workouts from saved programs, log set-level workout data, track goals, review history, and monitor training progress.

## Features

- Supabase authentication and account-based data syncing
- Workout logging with multiple exercises per session
- Set-level tracking for weight, reps, RIR, and partial reps
- Custom workout dates for forgotten sessions
- Exercise and workout notes
- Custom private exercise library
- Program builder with Push/Pull/Legs, Upper/Lower, and Full Body EOD support
- Start Workout from a saved program
- Goal tracking with editable progress
- Previous-performance hints while logging workouts
- Progress dashboard with recovery and deload recommendations
- Dark/light mode and accent color settings
- Installable PWA support for phone home screens
- Local device fallback when logged out

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- LocalStorage fallback for logged-out users

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Run the SQL files in the Supabase SQL Editor:

```txt
supabase/add-exercise-notes.sql
supabase/add-goals-programs.sql
supabase/add-program-sharing.sql
```

The app also expects the existing workout, exercise, set, profile, and custom exercise tables/policies created during development.

## Production Checklist

- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Environment Variables.
- Confirm Supabase Row Level Security policies are enabled.
- Confirm only the anon public key is used in frontend code.
- Run `npm run lint`.
- Run `npm run build`.
- Test the main flow: sign in, create program, start workout, save workout, edit goal, view dashboard.
- Test sharing: create a program, share it to another account email, then confirm that account can save a copy.
- After deployment, test mobile install: Safari Share -> Add to Home Screen, or Chrome menu -> Install app.

## Resume Summary

ExerciseInsight is a full-stack fitness tracking app built with Next.js, TypeScript, Tailwind CSS, and Supabase. It supports authenticated workout logging, set-level performance tracking, custom programs, goal tracking, exercise history, previous-performance hints, and cloud-synced user data.
