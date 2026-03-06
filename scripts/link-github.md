# Link this project to GitHub

## Option A: Automatic (recommended) – use GitHub CLI once

1. **Install GitHub CLI** (one-time):
   - Mac: `brew install gh`
   - Or: https://cli.github.com/

2. **Log in** (one-time):
   ```bash
   gh auth login
   ```
   Follow the prompts (browser or token). After this, `gh` can create repos and push for you.

3. **Create the repo and push** from the project root:
   ```bash
   cd /Users/moriii/Desktop/nextjs-boilerplate-main
   gh repo create nextjs-boilerplate-main --private --source=. --remote=origin --push
   ```
   - Use `--public` instead of `--private` if you want a public repo.
   - Change `nextjs-boilerplate-main` to any repo name you like.

After this, `git push` and `git pull` will work with `origin` automatically.

---

## Option B: Manual – create repo on GitHub, then link

1. **Create a new repo on GitHub**
   - Go to https://github.com/new
   - Repository name: e.g. `nextjs-boilerplate-main` (or whatever you like)
   - Leave "Add a README" **unchecked**
   - Create repository

2. **Add the remote and push** (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):
   ```bash
   cd /Users/moriii/Desktop/nextjs-boilerplate-main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. Next time you can just run:
   ```bash
   git push
   ```

---

## After linking

- **Push:** `git push` (or `git push origin main`)
- **Pull:** `git pull`
- Remote is stored in `.git/config`; no need to add it again.
