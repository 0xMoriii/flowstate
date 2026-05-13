# User Login (Google) & Cross-Device Data Persistence — Plan

This doc outlines simple, low-cost ways to add **Google sign-in** and **per-user data** that persists across browsers and devices for your Flowstate app.

---

## What needs to persist (currently in localStorage)

| Data | Storage key | Purpose |
|------|-------------|---------|
| Trades | `flowstate-trades` | Trade history / journal |
| Discipline notes | `flowstate-discipline-notes` | Notes per metric |
| Models | `flowstate-models` | Trade models / tags |
| Theme | `theme` | Light/dark (optional to sync) |
| “Has imported” flag | `flowstate-has-user-imported` | Onboarding state |

All of this can be stored **per user** in a small database (e.g. one row per user with JSON or a few tables).

---

## Option comparison (simple & cheap)

| Criteria | Option 1: Supabase (Auth + DB) | Option 2: Auth.js + DB | Option 3: Clerk + DB |
|----------|--------------------------------|------------------------|----------------------|
| **Cost** | Free tier: 500MB DB, 50k MAU | Auth: free. DB: free tier (e.g. Vercel Postgres / Supabase) | Free: 10k MAU. DB separate. |
| **Setup effort** | Low – one provider for auth + storage | Medium – auth config + DB + API routes | Low for auth UI; still need DB + API |
| **Google login** | Yes (via Supabase Auth) | Yes (Auth.js Google provider) | Yes (Clerk Google provider) |
| **Where you configure Google** | Supabase dashboard + Google Cloud Console | Google Cloud Console + `.env` | Clerk dashboard + Google Cloud Console |
| **Best for** | **Recommended:** one place for auth + data | Full control, no auth vendor | Fastest auth UI, less control |

---

## Recommended: Option 1 — Supabase (Auth + Database)

**Why this fits “simple, cheap, easy”:**

1. **One provider** – Google sign-in and user data in the same Supabase project (one dashboard, one set of env vars).
2. **Free tier** – 500 MB database, 50k monthly active users, unlimited API requests. Enough for a long time.
3. **No auth server code** – Supabase handles OAuth redirects and sessions; you call `supabase.auth.signInWithOAuth({ provider: 'google' })` and later read the user id from the session.
4. **Simple data model** – One table `user_data` with `user_id` (from Supabase Auth) and JSON columns (or a few columns) for trades, discipline_notes, models. Your app stays “trades + notes + models” with no complex schema.

**High-level steps:**

1. **Supabase**
   - Create project at [supabase.com](https://supabase.com).
   - In Authentication → Providers, enable Google and paste Google Client ID/Secret (from Google Cloud Console).
   - Add redirect URL in Supabase and in Google Cloud (e.g. `https://<project-ref>.supabase.co/auth/v1/callback` and your app’s callback route).

2. **Google Cloud Console**
   - Create OAuth 2.0 Client ID (Web application).
   - Set authorized redirect URI to the one Supabase gives you (and optionally your app’s callback for Next.js if you use a custom callback route).

3. **Next.js**
   - Install: `@supabase/supabase-js` and `@supabase/ssr`.
   - Create Supabase client helpers for browser and server (using `@supabase/ssr` for cookies).
   - Add auth callback route (e.g. `app/auth/callback/route.ts`) that exchanges code for session and redirects into the app.
   - Add a small **API layer** (e.g. `app/api/user-data/route.ts`) that:
     - Ensures the user is signed in (read session from Supabase).
     - GET: load `user_data` for `user.id`.
     - POST/PUT: upsert `user_data` for `user.id` (trades, discipline_notes, models as JSON).

4. **Client (ClientApp.tsx)**
   - Replace “load from localStorage” with “fetch from `/api/user-data`” when the user is signed in.
   - Replace “save to localStorage” with “POST to `/api/user-data`” when signed in.
   - Keep localStorage as **fallback when not signed in** (optional), so the app still works without an account.
   - Add a small **sign-in UI** (e.g. “Sign in with Google” that calls a server action or client-side `signInWithOAuth`), and a sign-out button when `session` exists.

**Effort (rough):**  
- One-time: ~1–2 hours (Supabase + Google OAuth + callback + one `user_data` table + one API route).  
- In your app: wire `ClientApp` to use session + `/api/user-data` instead of (or in addition to) localStorage.

---

## Alternative: Option 2 — Auth.js (v5) + Database

**When to choose:** You want auth to live entirely in your Next.js app and avoid Supabase Auth.

- **Auth:** [Auth.js](https://authjs.dev/) (e.g. `next-auth@5`) with Google provider. You add `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, and `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` from Google Cloud.
- **Database:** Any free-tier DB (e.g. Vercel Postgres / Neon, or Supabase **as DB only**). Store the same `user_data` keyed by Auth.js `session.user.id`.
- **API:** Same idea as Option 1: an API route that checks Auth.js `auth()` and reads/writes `user_data` for that user.

**Pros:** No dependency on Supabase Auth; full control.  
**Cons:** You configure and maintain auth routes and session handling yourself; slightly more code than Option 1.

---

## Alternative: Option 3 — Clerk + Database

**When to choose:** You want the **fastest possible** sign-in/sign-up UI with almost no custom auth UI.

- **Auth:** [Clerk](https://clerk.com) – add `<ClerkProvider>`, `<SignIn />` / `<SignOut />` (or use their pre-built components). Enable Google in Clerk dashboard and add Google OAuth credentials.
- **Database:** Same as above (e.g. Supabase free tier or Vercel Postgres). Store `user_data` by Clerk `userId`.
- **API:** In your API routes, get `userId` from Clerk’s `auth()` and read/write that user’s data.

**Pros:** Very quick to get a polished auth UI.  
**Cons:** Extra vendor; free tier is 10k MAU (still fine for small apps).

---

## Data model (same for all options)

Keep it minimal so setup stays easy:

- **Option A (single row per user):**  
  Table `user_data`: `id` (uuid), `user_id` (string, from auth provider), `trades` (jsonb), `discipline_notes` (jsonb), `models` (jsonb), `updated_at` (timestamp).  
  One row per user; GET returns it, POST/PUT overwrites or merges.

- **Option B (normalized):**  
  Separate tables for `trades`, `discipline_notes`, `models` with `user_id` on each. More flexible later but more API surface and migrations.

Starting with **Option A** is enough for “persist current localStorage data per user” and keeps implementation minimal.

---

## Summary recommendation

- **Best balance of simple, cheap, and easy:** **Option 1 — Supabase (Auth + Database).**
  - One account, one dashboard, one free tier.
  - Google sign-in + one `user_data` table + one API route.
  - Your work: Supabase + Google OAuth setup, callback route, `/api/user-data`, and wiring `ClientApp` to use session + API when logged in.

- If you prefer to keep auth inside Next.js and use a DB only: **Option 2 (Auth.js + Vercel Postgres or Supabase as DB).**

- If you want the least auth UI work and are okay with Clerk: **Option 3 (Clerk + Supabase or Vercel Postgres for storage).**

If you tell me which option you want (e.g. “Option 1 – Supabase”), the next step is to outline exact file changes and code snippets for your repo (callback route, `user_data` table, API route, and ClientApp wiring).
