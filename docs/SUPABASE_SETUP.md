# Supabase + Google Login — Setup Checklist

Do these steps once. After that, the app will use Google sign-in and persist user data in Supabase.

---

## 1. Environment variables

Create `.env.local` in the project root with:

```bash
# From Supabase: Project Settings → API (or Connect → Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

- **URL:** Supabase dashboard → Project Settings → API → Project URL  
- **Key:** Project Settings → API → Project API keys → `anon` public (or the new “Publishable” key if your project has one)

Never commit `.env.local` or share the anon key publicly in client-side code; the anon key is safe for browser use with Row Level Security (RLS).

---

## 2. Enable Google in Supabase

1. In Supabase: **Authentication → Providers → Google** → Enable.
2. You’ll need a **Client ID** and **Client Secret** from Google (step 3). Paste them here and save.

---

## 3. Google Cloud OAuth credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select (or create) a project.
2. **APIs & Services → Credentials** → **Create credentials → OAuth client ID**.
3. If prompted, configure the **OAuth consent screen** (External, add your app name and support email).
4. Application type: **Web application**.
5. **Authorized JavaScript origins:**
   - `http://localhost:3000` (local)
   - Your production origin, e.g. `https://yourdomain.com`
6. **Authorized redirect URIs:**
   - Supabase callback: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`  
     (Replace `YOUR_PROJECT_REF` with your Supabase project ref from the Supabase URL.)
   - App callback (for PKCE): `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback`
7. Create and copy **Client ID** and **Client Secret** into Supabase **Authentication → Providers → Google**.

---

## 4. Redirect URLs in Supabase

In Supabase: **Authentication → URL Configuration**:

- **Site URL:** e.g. `http://localhost:3000` (dev) or `https://yourdomain.com` (prod).
- **Redirect URLs:** add:
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback` (when you deploy)

---

## 5. Create the `user_data` table

In Supabase: **SQL Editor** → New query. Copy the contents of **`scripts/supabase-user-data-table.sql`** in this repo and run it.

---

## 6. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`, click **Sign in with Google**, and complete the flow. After sign-in, trades, discipline notes, and models are stored in Supabase and sync across devices.

---

## Production (Vercel)

For the **live site on Vercel** to support Google sign-in:

1. **Vercel env vars:** In the Vercel project → **Settings** → **Environment Variables**, add for **Production** (and Preview if you like):
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable/anon key
2. **Google Cloud:** Add your Vercel URL to the same OAuth client (Authorized JavaScript origins and Authorized redirect URIs). See **docs/GOOGLE_OAUTH_SETUP.md** → Part 4.
3. **Supabase:** In **Authentication** → **URL Configuration**, set **Site URL** to your Vercel URL and add `https://YOUR-APP.vercel.app/auth/callback` to **Redirect URLs**.
4. **Redeploy** the Vercel project after changing env vars.
