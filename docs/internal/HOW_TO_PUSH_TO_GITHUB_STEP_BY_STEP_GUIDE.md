# How to Push This Application to GitHub (Step-by-Step Guide)

## 1. Prerequisites

Before pushing this project to GitHub, make sure you have:

- **Git installed** on your machine.
  - Verify:
    ```bash
    git --version
    ```
- A **GitHub account** with permission to create repositories.
- A working **terminal**:
  - **PowerShell** (Windows) or
  - **Bash/Zsh** (macOS/Linux/WSL)
- Optional but recommended authentication setup:
  - **HTTPS + Personal Access Token (PAT)** (easy to start)
  - **SSH key** (better long-term experience)

### HTTPS vs SSH (Quick Decision)

- Use **HTTPS** if you want the fastest setup and are okay using tokens.
- Use **SSH** if you want passwordless pushes and frequent GitHub usage.

---

## 2. Create a GitHub Repository

1. Sign in to [https://github.com](https://github.com).
2. Click **New repository** (top-right **+** menu).
3. Enter a repository name (for example: `smoveqpp`).
4. Choose visibility:
   - **Private** for internal/proprietary code
   - **Public** for open-source/public sharing
5. **Important:** If this project already exists locally, **do not check**:
   - “Add a README file”
   - “Add .gitignore”
   - “Choose a license”

Keeping the remote repository empty avoids unrelated-history conflicts on first push.

---

## 3. Initialize Git Locally

From the project root directory, run:

```bash
git init
```

Then configure your identity (if not already configured globally):

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

(Optional, global setup):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Check status:

```bash
git status
```

---

## 4. Add a `.gitignore` Before First Commit

A `.gitignore` prevents pushing unnecessary or sensitive files.

Create/update `.gitignore` to include common Node/Vite patterns:

```gitignore
node_modules/
dist/
build/
.env
.env.*
*.log
coverage/
.DS_Store
```

> Adjust for your stack if needed (Python, Java, Docker artifacts, etc.).

Validate ignored files:

```bash
git status --ignored
```

---

## 5. Stage and Commit Your Code

Stage files:

```bash
git add .
```

Create initial commit:

```bash
git commit -m "chore: initial project commit"
```

Verify commit exists:

```bash
git log --oneline -n 5
```

---

## 6. Connect Local Repo to GitHub Remote

After creating the empty GitHub repo, copy its URL and add `origin`.

### Option A: HTTPS

```bash
git remote add origin https://github.com/<org-or-user>/<repo>.git
```

### Option B: SSH

```bash
git remote add origin git@github.com:<org-or-user>/<repo>.git
```

Confirm:

```bash
git remote -v
```

---

## 7. Set Main Branch and Push

Rename current branch to `main` (recommended):

```bash
git branch -M main
```

Push and set upstream:

```bash
git push -u origin main
```

After this, future pushes can be done with:

```bash
git push
```

---

## 8. Safe Push Checklist (Recommended for Team Use)

Before every push:

1. Confirm branch:
   ```bash
   git branch --show-current
   ```
2. Review changes:
   ```bash
   git status
   git diff
   ```
3. Pull latest remote changes first:
   ```bash
   git pull --rebase origin main
   ```
4. Run tests/lint/build (example):
   ```bash
   npm test
   npm run lint
   npm run build
   ```
5. Push:
   ```bash
   git push
   ```

---

## 9. Common Issues and Fixes

### Issue A: `remote origin already exists`

Cause: `origin` was previously set.

Fix:

```bash
git remote set-url origin <new-url>
# or
git remote remove origin
git remote add origin <new-url>
```

### Issue B: `failed to push some refs`

Cause: remote has commits your local does not.

Fix:

```bash
git pull --rebase origin main
git push
```

### Issue C: Authentication failed (HTTPS)

Cause: password auth disabled on GitHub.

Fix:

- Create a GitHub **Personal Access Token (PAT)**.
- Use token instead of password when prompted.
- Optionally store credentials with credential manager.

### Issue D: `Permission denied (publickey)` (SSH)

Cause: SSH key missing/unregistered.

Fix:

```bash
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub
```

- Add the printed key in GitHub → **Settings → SSH and GPG keys**.
- Test:

```bash
ssh -T git@github.com
```

### Issue E: Accidentally committed sensitive files

Immediate actions:

1. Rotate exposed secrets (API keys/passwords).
2. Remove tracked file and recommit:
   ```bash
   git rm --cached <file>
   git commit -m "chore: remove sensitive file"
   git push
   ```
3. If secrets are in history, rewrite history (advanced) with tools like `git filter-repo` and coordinate with team.

---

## 10. Ongoing Repository Maintenance

### Branching Strategy

- Keep `main` protected and deployable.
- Create feature branches:

```bash
git checkout -b feature/<short-description>
```

- Open Pull Requests for reviews.

### Commit Hygiene

- Use meaningful commit messages (`feat:`, `fix:`, `docs:`, `chore:`).
- Commit small, logical units.

### Sync Habit

Keep your local branch current:

```bash
git checkout main
git pull --rebase origin main
```

### Cleanup Habit

- Remove merged local branches:
  ```bash
  git branch --merged
  git branch -d <branch>
  ```
- Prune remote tracking refs:
  ```bash
  git fetch --prune
  ```

### Tagging Releases (Optional)

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

---

## 11. Quick Command Reference

```bash
# one-time init
git init
git add .
git commit -m "chore: initial project commit"
git branch -M main
git remote add origin <repo-url>
git push -u origin main

# day-to-day
git status
git add <files>
git commit -m "feat: ..."
git pull --rebase origin main
git push
```

---

## 12. Final Notes for Junior Developers

- Always run `git status` before and after each Git command.
- Never force push (`git push --force`) on shared branches unless explicitly approved.
- Prefer pull requests over direct pushes to `main` in team settings.
- If unsure, stop and ask for review before pushing.

This process keeps code history clean, reduces merge conflicts, and makes deployments safer.
