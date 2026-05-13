# New GitHub Repo + New Vercel Project

## Step 1: Create a new GitHub repo

1. Open: **https://github.com/new**
2. **Repository name:** e.g. `trader-lab` or `nextjs-boilerplate-deploy`
3. **Description:** `Trader Lab dashboard`
4. Choose **Public**
5. **Do not** check "Add a README" (you already have code)
6. Click **Create repository**

## Step 2: Add the new repo and push from your machine

In your terminal (in this project folder), run **one** of these (replace `YOUR_NEW_REPO_NAME` with the name you chose):

**If you use HTTPS:**
```bash
cd /Users/moriii/Desktop/nextjs-boilerplate-main
git remote add vercel https://github.com/0xMoriii/YOUR_NEW_REPO_NAME.git
git push -u vercel main
```

**If you use SSH:**
```bash
cd /Users/moriii/Desktop/nextjs-boilerplate-main
git remote add vercel git@github.com:0xMoriii/YOUR_NEW_REPO_NAME.git
git push -u vercel main
```

Example if the new repo is named `trader-lab`:
```bash
git remote add vercel https://github.com/0xMoriii/trader-lab.git
git push -u vercel main
```

## Step 3: Create a new Vercel project and link the new repo

1. Open: **https://vercel.com/new**
2. Under **Import Git Repository**, choose **GitHub**
3. Find and select your **new repo** (e.g. `trader-lab`), not the old one
4. Click **Import**
5. Leave **Framework Preset** as Next.js and **Root Directory** as `.`
6. Add **Environment Variable** (optional but needed for AI):
   - Name: `NEXT_PUBLIC_GEMINI_API_KEY`
   - Value: (paste your Gemini API key)
7. Click **Deploy**

Your new Vercel project will build only from the new GitHub repo, so you avoid the old project’s settings and blocks.
