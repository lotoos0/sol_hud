# Instrukcje pracy

## Przed każdym taskiem

- Twórz nowy branch według zasad Conventional Commits.

## W trakcie

- Aktualizuj wersję aplikacji zgodnie z SemVer (MAJOR.MINOR.PATCH) oraz samodzielnie identyfikuj typ zmian na podstawie diffu, opisu zadania, changelogu i wpływu na kompatybilność.

Zwiększ PATCH (0.0.x, 1.2.x), gdy zmiana dotyczy wyłącznie poprawek błędów, refaktoryzacji bez zmiany zachowania publicznego, drobnych poprawek UI lub dokumentacji bez wpływu na API i logikę biznesową.

Zwiększ MINOR (0.x.0, 1.x.0), gdy dodajesz nową funkcjonalność kompatybilną wstecz, nowy endpoint, nowe pole opcjonalne, nowy ekran, nową integrację albo oznaczasz element jako deprecated bez łamania dotychczasowego działania.

Zwiększ MAJOR (x.0.0), gdy zmiana łamie kompatybilność, np. usuwasz lub zmieniasz publiczny endpoint, zmieniasz kontrakt danych, wymagane pola, nazwy parametrów, zachowanie istniejącej funkcji albo sposób integracji po stronie klienta.

Po zwiększeniu MINOR wyzeruj PATCH, a po zwiększeniu MAJOR wyzeruj MINOR i PATCH.

Jeśli projekt jest nadal na etapie MVP lub niestabilnego API, używaj wersji 0.y.z; wtedy nadal identyfikuj zmiany jako fix / feature / breaking, ale utrzymuj numer główny 0 aż do momentu uznania produktu za stabilny.

## Po wykonanym tasku

- Wykonaj review zmian.
- Stwórz/zaaktualizuj plik CHANGELOG.md.
- Jeśli potrzeba, zrób update docs.
- Jeśli wszystko [OK]:
  - Otwórz PR - `git add .`, `git commit -m "feat/minor/fix/breaking: [krótki opis]"` z odpowiednim prefixem SemVer.
  - Push do brancha i stwórz PR z linkiem.
  - Podaj link do PR w podsumowaniu.
  - Zaktualizuj wersję w `package.json` / `Dockerfile` / `Chart.yaml` wg SemVer.
- Jeśli [NG]:
  - Opisz konkretny problem (błąd kompilacji, testy NG, linter, brakujące testy).
  - Podaj logi błędu (ostatnie 10 linii).
  - Zaproponuj fix lub czekaj na feedback.
  - **NIE twórz PR** z błędami.
