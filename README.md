# Sol HUD

![Version](https://img.shields.io/badge/version-0.15.1--MVP-00ff88?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28-47848f?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4?style=flat-square&logo=windows)

> Transparent Windows overlay that supports trading discipline on SOL (Solana). Always on top, minimal, and unobtrusive.

---

## Table of contents

- [Description](#description)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Session format](#session-format)
- [Contributing](#contributing)
- [License](#license)

---

## Description

Sol HUD is a desktop overlay (280 px wide) that stays above all windows. It helps the trader:

- **avoid entering** a trade without completing the checklist,
- **track lives** - after N losses (stop-loss), the session is locked,
- **record inactivity** - alert after 5 minutes without action,
- **save session history** in local JSON files.

Intended for SOL day traders who want to enforce process discipline.

---

## Features

| # | Feature | Description |
|---|---------|------|
| ❤️ | **Lives system** | Configurable lives (1-5); SL subtracts one life, 0 locks the session |
| ✅ | **Pre-entry checklist** | 4 fields (chart, narrative, bubblemap, holders); min. 3 unlock ENTRY |
| 📊 | **Live stats** | Number of attempts, wins, win-rate %, passive events |
| ⏱️ | **Passive timer** | 5 minutes without action -> pulsing border alert |
| 💾 | **Session auto-save** | After each action, file `sessions/YYYY-MM-DD_NNN.json` |
| 🖱️ | **Click-through** | Window is transparent to the mouse outside the UI area |
| 📍 | **Remembered position** | Window position persists between launches |
| 📁 | **Session export** | Button opens the `sessions/` folder in Explorer |

---

## Tech stack

| Layer | Technology | Role |
|---------|-------------|------|
| Runtime | Electron 28 | Frameless window, IPC, FS access |
| Frontend | Vanilla JS (ES2020) | UI logic, in-memory session state |
| Style | CSS3 (custom properties) | Dark theme, animations, drag regions |
| Persistence | JSON (local FS) | Sessions + window position |
| Bundler | - | None; no build step |

---

## Quick Start

**Requirements:** Node.js >= 18, npm >= 9, Windows 10/11

```bash
# 1. Clone the repository
git clone <url-repo>
cd sol-hud

# 2. Install dependencies
npm install

# 3. Start the app
npm start
```

The app appears in the top-left corner of the screen. You can drag it anywhere - the position is remembered.

---

## Usage

### 1. Start screen

Set the number of lives (default 3) and SOL limit (default 0.15), then click **START SESSION**.

### 2. Mini-bar (collapsed view)

```
❤️❤️❤️  W2 L1 67%  Vault  ⚙  v0.15.1  ≡
```

Click `≡` to expand the panel.

### 3. Expanded panel

```
❤️❤️❤️  v0.15.1 MVP  ×
┌─────────┬─────────┐
│Attempts │  Wins   │
│    3    │    2    │
├─────────┼─────────┤
│Win Rate │Passive  │
│   67%   │    0    │
└─────────┴─────────┘
☑ Setup aligned    ☑ Trend confirmed
☐ Risk accepted    ☐ News checked

[ ✅ ENTRY ]  [ ❌ PASS ]  [ 💀 SL ]
          [ End Session ]
```

- Select **min. 3** checkboxes to unlock **ENTRY**
- **ENTRY** = trade taken (win)
- **PASS** = deliberate skip (loss in stats, lives unchanged)
- **SL** = stop-loss - subtracts one life

### 4. End of session

After clicking **End Session**, a summary with results is shown along with an option to open the session files folder.

---

## Session format

Each session is saved in `sessions/YYYY-MM-DD_NNN.json`:

```json
{
  "session_id": "2026-04-24_001",
  "started_at": "2026-04-24T10:00:00.000Z",
  "ended_at":   "2026-04-24T12:30:00.000Z",
  "config": { "lives": 3, "sol_limit": 0.15 },
  "summary": {
    "attempts": 5,
    "wins": 3,
    "losses": 2,
    "win_rate": "60.0",
    "passive_events": 1,
    "sl_hits": 1
  },
  "trades": [
    { "type": "ENTRY", "at": "2026-04-24T10:15:00.000Z", "lives": 3, "attempts": 1, "wins": 1, "losses": 0 }
  ],
  "window_position": { "x": 10, "y": 10 }
}
```

Trade type: `ENTRY` | `PASS` | `SL`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT © 2026
