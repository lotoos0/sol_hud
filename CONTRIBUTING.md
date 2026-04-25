# Contributing

Thank you for your interest in developing Sol HUD! Below you will find everything you need to collaborate effectively.

---

## Table of contents

- [Reporting bugs](#reporting-bugs)
- [Feature proposals](#feature-proposals)
- [Development workflow](#development-workflow)
- [Code style](#code-style)
- [Commit structure](#commit-structure)
- [Pull Requests](#pull-requests)

---

## Reporting bugs

Before opening an issue, check whether a similar bug has already been reported.

When reporting, provide:

1. **Operating system and version** (for example Windows 11 22H2)
2. **Node.js version** (`node -v`) and **npm** (`npm -v`)
3. **Reproduction steps** - the minimal sequence of actions that leads to the bug
4. **Expected behavior** vs **actual behavior**
5. **DevTools logs** - run `npm start`, open DevTools (F12 or automatically), and paste console errors

```
Environment:
- OS: Windows 11
- Node: 20.11.0
- npm: 10.2.4
- Sol HUD version: 0.1.1
```

---

## Feature proposals

Open an issue with the `enhancement` tag and describe:

- **Problem** you want to solve (what is frustrating?)
- **Proposed solution** (how should it work?)
- **Alternatives** you considered

---

## Development workflow

### Requirements

- Node.js >= 18
- npm >= 9
- Windows 10/11 (overlay uses Windows-specific APIs: `transparent`, `alwaysOnTop`)

### Setup

```bash
git clone <url-repo>
cd sol-hud
npm install
npm start
```

### Branching

```
main          # stable production version
dev           # active development, PRs go here
feature/<description>  # e.g. feature/keyboard-shortcuts
fix/<description>      # e.g. fix/passive-timer-reset
```

Work on a `feature/*` or `fix/*` branch, and submit PRs to `dev`.

### Main branch protection

The `main` branch should stay releasable. Recommended GitHub rules:

- Require a pull request before merging.
- Require at least 1 approving review.
- Require status checks to pass before merging: `validate`.
- Require branches to be up to date before merging.
- Require conversation resolution before merging.
- Block force pushes and branch deletion.
- Allow administrators to bypass only for emergency fixes.

### Manual testing

There are no automated tests. Before a PR, test manually:

| Scenario | Expected result |
|-----------|-----------------|
| Start session, 3 lives | Mini-bar 44 px, hearts ❤️❤️❤️ |
| Click ENTRY without 3 checkboxes | Button disabled |
| Select 3/4 checkboxes | ENTRY unlocks |
| Click SL 3 times | Session locked, "Session over" message |
| No action for 5 min | Pulsing border (passive-alert) |
| Close and reopen the app | Window appears in the same position |
| End Session -> summary | JSON file in `sessions/` |

---

## Code style

The project does not have ESLint or Prettier configured. Follow the conventions already present in the files:

### JavaScript

```js
// ✅ Good - const/let, arrow functions, async/await
const result = await window.electronAPI.saveSession(data);

// ❌ Bad - var, callback hell
var result = window.electronAPI.saveSession(data, function(r) { ... });
```

- `const` wherever possible, `let` when mutation is needed
- `async/await` instead of `.then()/.catch()`
- No comments explaining **what** the code does - only **why** (non-obvious cases)
- Verb-based function names: `renderHearts()`, `lockSession()`, `onSL()`

### CSS

- Use CSS variables (`--accent`, `--danger`, `--bg`, `--text`, `--dim`)
- Do not add external CSS dependencies
- Keep `user-select: none` across the whole UI (the overlay should not allow text selection)

### IPC

- Declare new IPC channels in `preload.js` (bridge) - do not use `ipcRenderer` directly in `renderer.js`
- One-way channels (fire-and-forget): `ipcRenderer.send` / `ipcMain.on`
- Channels with response: `ipcRenderer.invoke` / `ipcMain.handle`

---

## Commit structure

Format: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**

| Type | When |
|-----|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change without behavior change |
| `style` | CSS/formatting changes |
| `docs` | Documentation |
| `chore` | Configuration, dependencies |

**Examples:**

```
feat(renderer): add keyboard shortcuts for ENTRY/PASS/SL
fix(main): prevent duplicate session IDs on rapid start
docs: update README with session JSON schema
chore: upgrade electron to 28.3.0
```

---

## Pull Requests

1. Create a branch from `dev`: `git checkout -b feature/moja-funkcja dev`
2. Make changes and commit according to the convention above
3. Test manually (see the table above)
4. Open a PR to `dev` with a description:
   - What changed and why
   - How to test
   - Link to the related issue (if applicable)

The PR will be reviewed within 48 h.
