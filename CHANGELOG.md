# Changelog

Wszystkie istotne zmiany w projekcie są dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).
Projekt stosuje [Semantic Versioning](https://semver.org/lang/pl/).

---

## [Unreleased]

### Planowane (Added)

- [ ] Ciemny motyw kolorystyczny z możliwością wyboru akcentu
- [ ] Eksport CSV z historią sesji
- [ ] Wykres win-rate w czasie (sparkline)
- [ ] Skróty klawiaturowe dla ENTRY / PASS / SL
- [ ] Konfigurowalny timeout pasywnego timera (domyślnie 5 min)
- [ ] Wielojęzyczność UI (PL/EN)
- [ ] Tray icon z szybkim dostępem
- [ ] Auto-updater (electron-updater)

### Planowane (Changed)

- [ ] Checklista — konfigurowalna przez użytkownika (zamiast hardcoded 4 pozycji)
- [ ] Minimum wymaganych checkboxów konfigurowalnie (teraz 3 z 4)

### Planowane (Fixed)

- [ ] DevTools otwierają się automatycznie przy starcie (do usunięcia w release)

---

## [0.1.1] — 2026-04-24

### Added

- Dodano `AGENTS.md` z instrukcjami pracy dla agentów.
- Dodano dokumentację projektu w `README.md`, `CONTRIBUTING.md` i `CLAUDE.md`.

---

## [0.1.0] — 2026-04-24

### Added

- Frameless, przezroczysty overlay Electron (zawsze na wierzchu, 280 px)
- Ekran startowy z konfiguracją: liczba żyć (1–5) i limit SOL
- System żyć z wyświetlaniem ❤️/🖤 (pełne/puste)
- Mini-bar (44 px) z wyświetlaniem żyć, statystyk W/L i win-rate
- Panel rozwinięty z siatką statystyk 2×2 (attempts, wins, win rate, passive)
- Checklista 4 pól (chart, narrative, bubblemap, holders) — min. 3 odblokuje ENTRY
- Przyciski akcji: **ENTRY** (wygrana), **PASS** (strata bez SL), **SL** (stop-loss)
- Licznik zdarzeń pasywnych — alarm po 5 minutach braku akcji (pulsujący border)
- Auto-blokada sesji gdy życia = 0 (stan `is-locked`)
- Ekran podsumowania sesji z wynikami i opcją eksportu
- Auto-zapis sesji do `sessions/YYYY-MM-DD_NNN.json` po każdej akcji
- Persystencja pozycji okna między uruchomieniami (`sessions/_window.json`)
- Click-through — okno nie blokuje myszy poza obszarem interaktywnym
- IPC bridge (`preload.js`) z pełną izolacją kontekstu (`contextIsolation: true`)
- Generowanie unikalnego ID sesji: `YYYY-MM-DD_NNN` (auto-increment)
- Przycisk otwierający folder `sessions/` w Eksploratorze Windows

---

[Unreleased]: https://github.com/lotoos0/sol_hud/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/lotoos0/sol_hud/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/lotoos0/sol_hud/releases/tag/v0.1.0
