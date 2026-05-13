# Google OAuth Client ID — Step-by-step setup

Follow these steps to get a **Client ID** and **Client Secret** for "Sign in with Google" with your Flowstate app.

---

## Part 1: Google Cloud Console

### Step 1: Open Google Cloud Console

1. Go to **[console.cloud.google.com](https://console.cloud.google.com/)** and sign in.
2. In the top bar, click the **project dropdown** (it may say "Select a project" or your project name).
3. Either **select an existing project** or click **New Project**:
   - Name it something like `Flowstate` or `My App`.
   - Click **Create** and wait for it to be created, then select it.

---

### Step 2: Configure the OAuth consent screen (first time only)

You only need to do this once per project. If you’ve already done it, skip to **Step 3**.

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**  
   (or search for "OAuth consent screen" in the top search bar).
2. Choose **External** (so any Google user can sign in) → **Create**.
3. Fill in:
   - **App name:** e.g. `Flowstate`
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue**.
5. On **Scopes**: click **Add or Remove Scopes**. You should see:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`  
   If they’re there, click **Update** → **Save and Continue**. If not, add `openid` and the two userinfo scopes, then **Save and Continue**.
6. On **Test users** (optional): you can add test emails if the app is in "Testing" mode. Click **Save and Continue**.
7. Review the summary and click **Back to Dashboard**.

---

### Step 3: Create the OAuth Client ID

1. In the left sidebar, go to **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** at the top → **OAuth client ID**.
3. If you see “Configure consent screen”, click it and finish **Step 2** above, then come back to **Credentials** and click **+ Create Credentials** → **OAuth client ID** again.
4. **Application type:** choose **Web application**.
5. **Name:** e.g. `Flowstate Web` (any name you like).
6. **Authorized JavaScript origins** — click **+ Add URI** and add these one by one:
   - `http://localhost:3000`
   - Your **production** URL (e.g. `https://your-app.vercel.app` or `https://yourdomain.com`) — add this now so both local and live work with the same Client ID.
7. **Authorized redirect URIs** — click **+ Add URI** and add **all three**:
   - `https://hwthaavtazmockftdthg.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`
   - Your **production** callback (e.g. `https://your-app.vercel.app/auth/callback` or `https://yourdomain.com/auth/callback`).
8. Click **Create**.
9. A popup will show your **Client ID** and **Client Secret**.  
   - Click **Copy** for each, or keep the window open.  
   - You’ll paste these into Supabase in Part 2.

---

## Part 2: Add the credentials to Supabase

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)** and select your Flowstate project.
2. Go to **Authentication** → **Providers** in the left sidebar.
3. Find **Google** and click it (or **Enable** if it’s disabled).
4. Turn **Enable Sign in with Google** **On**.
5. Paste:
   - **Client ID (for OAuth):** the long string ending in `.apps.googleusercontent.com`
   - **Client Secret (for OAuth):** the secret from the Google popup
6. Click **Save**.

---

## Part 3: Redirect URLs in Supabase

1. Still in Supabase: **Authentication** → **URL Configuration**.
2. **Site URL:** use your **production** URL (e.g. `https://your-app.vercel.app`) so the live site is the default. You can still test locally.
3. Under **Redirect URLs**, add **both** (so local and production work):
   - `http://localhost:3000/auth/callback`
   - Your production callback, e.g. `https://your-app.vercel.app/auth/callback`
4. Click **Save**.

---

## Part 4: Production (Vercel / live site)

To have **Sign in with Google** work on your Vercel-hosted site, do the following once. The same Google OAuth Client ID works for both local and production.

### 4a. Google Cloud Console

1. Go to **APIs & Services** → **Credentials** → click your **OAuth 2.0 Client ID** (the one you created).
2. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `https://YOUR-VERCEL-URL.vercel.app`  
   (Use your real Vercel URL, e.g. `https://flowstate.vercel.app`. If you use a custom domain, add that too, e.g. `https://app.yourapp.com`.)
3. Under **Authorized redirect URIs**, click **+ Add URI** and add:
   - `https://YOUR-VERCEL-URL.vercel.app/auth/callback`  
   (Same base URL + `/auth/callback`. Add your custom domain callback too if you use one.)
4. Click **Save**.

### 4b. Supabase URL Configuration

1. **Authentication** → **URL Configuration**.
2. **Site URL:** set to your live URL, e.g. `https://YOUR-VERCEL-URL.vercel.app`.
3. **Redirect URLs:** ensure the list includes:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-VERCEL-URL.vercel.app/auth/callback`
4. **Save**.

### 4c. Vercel environment variables

So the app can talk to Supabase in production:

1. Open your project on **[vercel.com](https://vercel.com)** → **Settings** → **Environment Variables**.
2. Add (for **Production**, and optionally Preview/Development if you want):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://hwthaavtazmockftdthg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key (same as in `.env.local`)
3. **Save** and **redeploy** the project (Deployments → … → Redeploy) so the new env vars are used.

After redeploy, open your live URL and use **Sign in with Google** — it should work the same as locally.

---

## Quick reference: URIs to use

| Purpose | Local | Production (Vercel) |
|--------|--------|----------------------|
| Authorized JavaScript origin | `http://localhost:3000` | `https://YOUR-APP.vercel.app` |
| Authorized redirect (your app) | `http://localhost:3000/auth/callback` | `https://YOUR-APP.vercel.app/auth/callback` |
| Supabase Auth callback (same for both) | `https://hwthaavtazmockftdthg.supabase.co/auth/v1/callback` | (same) |

---

## Test it

**Local:** run `npm run dev`, open **http://localhost:3000**, click **Sign in with Google**.

**Production:** open your Vercel URL (e.g. `https://your-app.vercel.app`), click **Sign in with Google**.

If you see **redirect_uri_mismatch**: the redirect URI in the error message must be listed exactly in both Google Cloud (Authorized redirect URIs) and Supabase (Redirect URLs)—same protocol (`http`/`https`), no trailing slash.
