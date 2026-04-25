# Contributing

Dziękujemy za zainteresowanie rozwojem Sol HUD! Poniżej znajdziesz wszystko, czego potrzebujesz, żeby efektywnie współpracować.

---

## Spis treści

- [Zgłaszanie błędów](#zgłaszanie-błędów)
- [Propozycje funkcji](#propozycje-funkcji)
- [Development workflow](#development-workflow)
- [Styl kodu](#styl-kodu)
- [Struktura commitów](#struktura-commitów)
- [Pull Requesty](#pull-requesty)

---

## Zgłaszanie błędów

Zanim otworzysz issue, sprawdź, czy podobny błąd nie został już zgłoszony.

Podczas zgłaszania podaj:

1. **System operacyjny i wersję** (np. Windows 11 22H2)
2. **Wersję Node.js** (`node -v`) i **npm** (`npm -v`)
3. **Kroki reprodukcji** — minimalna sekwencja akcji prowadząca do błędu
4. **Zachowanie oczekiwane** vs **zachowanie rzeczywiste**
5. **Logi z DevTools** — uruchom `npm start`, otwórz DevTools (F12 lub automatycznie) i wklej błędy z konsoli

```
Środowisko:
- OS: Windows 11
- Node: 20.11.0
- npm: 10.2.4
- Wersja Sol HUD: 0.1.1
```

---

## Propozycje funkcji

Otwórz issue z tagiem `enhancement` i opisz:

- **Problem**, który chcesz rozwiązać (co Cię frustruje?)
- **Proponowane rozwiązanie** (jak powinno działać?)
- **Alternatywy**, które rozważałeś

---

## Development workflow

### Wymagania

- Node.js ≥ 18
- npm ≥ 9
- Windows 10/11 (overlay używa Windows-specific API: `transparent`, `alwaysOnTop`)

### Setup

```bash
git clone <url-repo>
cd sol-hud
npm install
npm start
```

### Branching

```
main          # stabilna wersja produkcyjna
dev           # aktywny development, PR-y trafiają tutaj
feature/<opis>  # np. feature/keyboard-shortcuts
fix/<opis>      # np. fix/passive-timer-reset
```

Pracuj na gałęzi `feature/*` lub `fix/*`, PR składaj do `dev`.

### Testowanie ręczne

Brak automatycznych testów. Przed PR przetestuj manualnie:

| Scenariusz | Oczekiwany wynik |
|-----------|-----------------|
| Start sesji, 3 życia | Mini-bar 44 px, serce ❤️❤️❤️ |
| Kliknij ENTRY bez 3 checkboxów | Przycisk disabled |
| Zaznacz 3/4 checkboxów | ENTRY się odblokowuje |
| Kliknij SL 3 razy | Sesja zablokowana, komunikat „Session over" |
| Brak akcji przez 5 min | Pulsujący border (passive-alert) |
| Zamknij i otwórz aplikację | Okno pojawia się na tej samej pozycji |
| End Session → podsumowanie | Plik JSON w `sessions/` |

---

## Styl kodu

Projekt nie ma skonfigurowanego ESLint ani Prettiera. Stosuj się do konwencji obecnych w plikach:

### JavaScript

```js
// ✅ Dobrze — const/let, arrow functions, async/await
const result = await window.electronAPI.saveSession(data);

// ❌ Źle — var, callback hell
var result = window.electronAPI.saveSession(data, function(r) { ... });
```

- `const` wszędzie gdzie możliwe, `let` gdy potrzebna mutacja
- `async/await` zamiast `.then()/.catch()`
- Brak komentarzy wyjaśniających **co** kod robi — tylko **dlaczego** (nieoczywiste przypadki)
- Nazwy funkcji czasownikowe: `renderHearts()`, `lockSession()`, `onSL()`

### CSS

- Używaj zmiennych CSS (`--accent`, `--danger`, `--bg`, `--text`, `--dim`)
- Nie dodawaj zewnętrznych zależności CSS
- Zachowaj `user-select: none` na całym UI (overlay nie powinien pozwalać na zaznaczanie tekstu)

### IPC

- Nowe kanały IPC deklaruj w `preload.js` (bridge) — nie używaj `ipcRenderer` bezpośrednio w `renderer.js`
- Kanały jednokierunkowe (fire-and-forget): `ipcRenderer.send` / `ipcMain.on`
- Kanały z odpowiedzią: `ipcRenderer.invoke` / `ipcMain.handle`

---

## Struktura commitów

Format: [Conventional Commits](https://www.conventionalcommits.org/pl/v1.0.0/)

```
<typ>(<zakres>): <opis>

[opcjonalne ciało]
[opcjonalna stopka]
```

**Typy:**

| Typ | Kiedy |
|-----|-------|
| `feat` | Nowa funkcja |
| `fix` | Naprawa błędu |
| `refactor` | Zmiana kodu bez zmiany zachowania |
| `style` | Zmiany CSS/formatowanie |
| `docs` | Dokumentacja |
| `chore` | Konfiguracja, zależności |

**Przykłady:**

```
feat(renderer): add keyboard shortcuts for ENTRY/PASS/SL
fix(main): prevent duplicate session IDs on rapid start
docs: update README with session JSON schema
chore: upgrade electron to 28.3.0
```

---

## Pull Requesty

1. Utwórz branch z `dev`: `git checkout -b feature/moja-funkcja dev`
2. Wprowadź zmiany, commituj zgodnie z konwencją powyżej
3. Przetestuj manualnie (patrz tabela wyżej)
4. Otwórz PR do `dev` z opisem:
   - Co zostało zmienione i dlaczego
   - Jak przetestować
   - Link do powiązanego issue (jeśli dotyczy)

PR będzie zreviewowany w ciągu 48 h.
