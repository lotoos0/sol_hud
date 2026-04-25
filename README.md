# Sol HUD

![Wersja](https://img.shields.io/badge/wersja-0.1.1--MVP-00ff88?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28-47848f?style=flat-square&logo=electron)
![Licencja](https://img.shields.io/badge/licencja-MIT-blue?style=flat-square)
![Platform](https://img.shields.io/badge/platforma-Windows-0078d4?style=flat-square&logo=windows)

> Przezroczysty overlay dla Windows wspomagający dyscyplinę tradingu na SOL (Solana). Zawsze na wierzchu, minimalny, nie przeszkadza w pracy.

---

## Spis treści

- [Opis](#opis)
- [Funkcjonalności](#funkcjonalności)
- [Tech stack](#tech-stack)
- [Quick Start](#quick-start)
- [Sposób użycia](#sposób-użycia)
- [Format sesji](#format-sesji)
- [Contributing](#contributing)
- [Licencja](#licencja)

---

## Opis

Sol HUD to nakładka desktopowa (280 px szerokości) działająca nad wszystkimi oknami. Pomaga traderowi:

- **nie wchodzić** w trade bez ukończonego checklisty,
- **liczyć życia** — po N stratach (stop-loss) sesja jest blokowana,
- **rejestrować pasywność** — alarm po 5 minutach braku akcji,
- **zapisywać historię sesji** w lokalnych plikach JSON.

Skierowany do day-traderów SOL, którzy chcą wymusić na sobie dyscyplinę procesu.

---

## Funkcjonalności

| # | Funkcja | Opis |
|---|---------|------|
| ❤️ | **System żyć** | Konfigurowalne życia (1–5); SL odejmuje życie, 0 blokuje sesję |
| ✅ | **Checklista przed wejściem** | 4 pola (wykres, narracja, bańka, holderzy); min. 3 odblokują ENTRY |
| 📊 | **Statystyki na żywo** | Liczba prób, wygrane, win-rate %, zdarzenia pasywne |
| ⏱️ | **Timer pasywny** | 5 minut bez akcji → pulsujący alert na obramowaniu |
| 💾 | **Auto-zapis sesji** | Po każdej akcji plik `sessions/YYYY-MM-DD_NNN.json` |
| 🖱️ | **Click-through** | Okno przezroczyste dla myszy poza obszarem UI |
| 📌 | **Zapamiętana pozycja** | Pozycja okna persystuje między uruchomieniami |
| 📁 | **Eksport sesji** | Przycisk otwiera folder `sessions/` w Eksploratorze |

---

## Tech stack

| Warstwa | Technologia | Rola |
|---------|-------------|------|
| Runtime | Electron 28 | Frameless window, IPC, dostęp do FS |
| Frontend | Vanilla JS (ES2020) | Logika UI, stan sesji w pamięci |
| Styl | CSS3 (custom properties) | Dark theme, animacje, drag regions |
| Persystencja | JSON (lokalny FS) | Sesje + pozycja okna |
| Bundler | — | Brak; żadnego kroku budowania |

---

## Quick Start

**Wymagania:** Node.js ≥ 18, npm ≥ 9, Windows 10/11

```bash
# 1. Sklonuj repozytorium
git clone <url-repo>
cd sol-hud

# 2. Zainstaluj zależności
npm install

# 3. Uruchom aplikację
npm start
```

Aplikacja pojawia się w lewym górnym rogu ekranu. Możesz ją przeciągnąć w dowolne miejsce — pozycja jest zapamiętana.

---

## Sposób użycia

### 1. Ekran startowy

Ustaw liczbę żyć (domyślnie 3) i limit SOL (domyślnie 0,15), następnie kliknij **START SESSION**.

### 2. Mini-bar (widok zwinięty)

```
❤️❤️❤️  W:2 L:1 67%  v0.1.1  ≡
```

Kliknij `≡` żeby rozwinąć panel.

### 3. Panel rozwinięty

```
❤️❤️❤️  v0.1.1 MVP  ×
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

- Zaznacz **min. 3** checkboxy żeby odblokować **ENTRY**
- **ENTRY** = trade wzięty (wygrana)
- **PASS** = świadome ominięcie (strata do statystyk, życie bez zmian)
- **SL** = stop-loss — odejmuje życie

### 4. Koniec sesji

Po kliknięciu **End Session** widoczne jest podsumowanie z wynikami oraz opcja otwarcia folderu z plikami sesji.

---

## Format sesji

Każda sesja zapisywana jest w `sessions/YYYY-MM-DD_NNN.json`:

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

Typ handlu: `ENTRY` | `PASS` | `SL`

---

## Contributing

Zobacz [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licencja

MIT © 2026
