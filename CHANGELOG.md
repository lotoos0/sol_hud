# Changelog

All notable changes in this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned (Added)

- [ ] Dark color theme with selectable accent
- [ ] CSV export of session history
- [ ] Win-rate over time chart (sparkline)
- [ ] Keyboard shortcuts for ENTRY / PASS / SL
- [ ] Configurable passive timer timeout (default 5 min)
- [ ] UI internationalization (PL/EN)
- [ ] Tray icon with quick access
- [ ] Auto-updater (electron-updater)

### Planned (Changed)

- [ ] Checklist - user-configurable instead of hardcoded 4 items
- [ ] Minimum required checkboxes configurable (currently 3 of 4)

### Planned (Fixed)

- [ ] DevTools open automatically on startup (to remove in release)

---

## [0.13.2] - 2026-04-27

### Fixed

- Increased the collapsed HUD lives slot buffer so five rendered heart emojis do not clip at the right edge.
- Updated visible application version labels to `0.13.2`.

---

## [0.13.1] - 2026-04-27

### Fixed

- Made the mini HUD width and lives area respond to the configured lives count so all hearts remain visible in collapsed mode.
- Updated visible application version labels to `0.13.1`.

---

## [0.13.0] - 2026-04-26

### Added

- Added the Electron auto-updater runtime dependency, main-process import, GitHub publish metadata, and packaged app icon configuration.

### Fixed

- Aligned Electron Builder release metadata with the hyphenated installer artifact name used by the Release workflow.
- Moved packaged app session/player state writes to Electron `userData` and kept quest definitions read-only in the bundled app.
- Included cosmetics in quest definition IPC data so the Trader Vault can render shop items.
- Updated visible application version labels to `0.13.0`.

---

## [0.12.4] - 2026-04-26

### Fixed

- Disabled Electron Builder auto-publish during the Release workflow build step so GitHub release creation remains handled by the explicit `gh release create` step.
- Updated visible application version labels to `0.12.4`.

---

## [0.12.3] - 2026-04-26

### Fixed

- Added the missing Windows build script and Electron Builder configuration required by the Release workflow.
- Granted the Release workflow write access to create GitHub releases.
- Updated visible application version labels to `0.12.3`.

---

## [0.12.2] - 2026-04-26

### Fixed

- Increased the mini-bar lives area so the third heart no longer gets clipped.
- Updated visible application version labels to `0.12.2`.

---

## [0.12.1] - 2026-04-26

### Fixed

- Tightened the mini-bar layout so Vault, settings, stats, lives, and version labels do not wrap or overflow.
- Restored compact window sizing after closing the Vault panel.
- Updated visible application version labels to `0.12.1`.

---

## [0.12.0] - 2026-04-26

### Added

- Added HUD opacity settings with live preview and debounced player-state persistence.
- Added a daily recap summary with session rewards, benchmark comparison, quest progress, boss status, sharing placeholder, and new-session action.
- Added Trader Vault cosmetics data and UI for buying and equipping heart skins, borders, sound packs, and titles.

### Changed

- Updated visible application version labels to `0.12.0`.

---

## [0.11.0] - 2026-04-25

### Added

- Added hot/cold session border state, streak display, rank-gated timer, tilt pattern alerts, boss fight events, and keyboard shortcuts.

### Changed

- Updated visible application version labels to `0.11.0`.

---

## [0.10.0] - 2026-04-25

### Added

- Added player session reward application with XP, coins, rank, streak, and aggregate stat updates.
- Added daily login bonus, rusty state detection, and comeback session XP multiplier.

### Changed

- Updated visible application version labels to `0.10.0`.

---

## [0.9.0] - 2026-04-25

### Added

- Added XP, coin, and rank progression constants and pure calculation helpers.

### Changed

- Updated visible application version labels to `0.9.0`.

---

## [0.8.0] - 2026-04-25

### Added

- Added preload bridge methods for player, quest state, and quest definition IPC channels.

### Changed

- Updated visible application version labels to `0.8.0`.

---

## [0.7.0] - 2026-04-25

### Added

- Added IPC handlers for player storage, quest state storage, and quest definition loading.

### Changed

- Updated visible application version labels to `0.7.0`.

---

## [0.6.0] - 2026-04-25

### Added

- Added static quest definitions in `data/quests_definitions.json`.

### Changed

- Updated visible application version labels to `0.6.0`.

---

## [0.5.2] - 2026-04-25

### Fixed

- Increased expanded HUD window height again to prevent the end-session controls from touching the bottom edge.
- Updated visible application version labels to `0.5.2`.

---

## [0.5.1] - 2026-04-25

### Fixed

- Increased expanded HUD window height so bottom controls remain visible.
- Updated visible application version labels to `0.5.1`.

---

## [0.5.0] - 2026-04-25

### Added

- Added `storage/questStore.js` for loading and saving quest state.
- Added read-only quest definitions loading from `data/quests_definitions.json`.
- Added `storage/questStore.js` to the local JavaScript syntax validation script.

### Changed

- Updated visible application version labels to `0.5.0`.

---

## [0.4.1] - 2026-04-25

### Changed

- Clarified agent instructions to update stored and displayed application versions for every repository change.
- Updated visible application version labels to `0.4.1`.

---

## [0.4.0] - 2026-04-25

### Added

- Added `storage/playerStore.js` for loading, creating, and saving `sessions/player.json`.
- Added `storage/playerStore.js` to the local JavaScript syntax validation script.

---

## [0.3.0] - 2026-04-25

### Added

- Added a GitHub Actions CI workflow for dependency install and JavaScript syntax checks.
- Added a reproducible GitHub branch protection configuration for `main` with PRs and CI required.
- Added npm `check` and `test` scripts for local validation.
- Documented recommended `main` branch protection rules.

### Changed

- Updated documented MVP version references to `0.3.0`.

---

## [0.2.0] - 2026-04-25

### Added

- Added a live SOL P&L tracker for ENTRY and SL actions.

### Fixed

- Added a defensive passive timer guard before session start.
- Added live validation for start screen lives and SOL limit inputs.

---

## [0.1.1] - 2026-04-24

### Added

- Added `AGENTS.md` with working instructions for agents.
- Added project documentation in `README.md`, `CONTRIBUTING.md`, and `CLAUDE.md`.

---

## [0.1.0] - 2026-04-24

### Added

- Frameless, transparent Electron overlay (always on top, 280 px)
- Start screen with configuration: number of lives (1-5) and SOL limit
- Lives system with hearts display (full/empty)
- Mini-bar (44 px) displaying lives, W/L stats, and win-rate
- Expanded panel with a 2x2 stats grid (attempts, wins, win rate, passive)
- Checklist with 4 fields (chart, narrative, bubblemap, holders) - min. 3 unlock ENTRY
- Action buttons: **ENTRY** (win), **PASS** (loss without SL), **SL** (stop-loss)
- Passive event counter - alert after 5 minutes without action (pulsing border)
- Session auto-lock when lives = 0 (`is-locked` state)
- Session summary screen with results and export option
- Session auto-save to `sessions/YYYY-MM-DD_NNN.json` after each action
- Window position persistence between launches (`sessions/_window.json`)
- Click-through - window does not block the mouse outside the interactive area
- IPC bridge (`preload.js`) with full context isolation (`contextIsolation: true`)
- Unique session ID generation: `YYYY-MM-DD_NNN` (auto-increment)
- Button that opens the `sessions/` folder in Windows Explorer

---

[Unreleased]: https://github.com/lotoos0/sol_hud/compare/v0.13.2...HEAD
[0.13.2]: https://github.com/lotoos0/sol_hud/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/lotoos0/sol_hud/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/lotoos0/sol_hud/compare/v0.12.4...v0.13.0
[0.12.4]: https://github.com/lotoos0/sol_hud/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/lotoos0/sol_hud/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/lotoos0/sol_hud/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/lotoos0/sol_hud/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/lotoos0/sol_hud/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/lotoos0/sol_hud/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/lotoos0/sol_hud/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/lotoos0/sol_hud/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/lotoos0/sol_hud/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/lotoos0/sol_hud/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/lotoos0/sol_hud/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/lotoos0/sol_hud/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/lotoos0/sol_hud/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/lotoos0/sol_hud/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/lotoos0/sol_hud/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/lotoos0/sol_hud/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/lotoos0/sol_hud/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/lotoos0/sol_hud/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/lotoos0/sol_hud/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/lotoos0/sol_hud/releases/tag/v0.1.0
