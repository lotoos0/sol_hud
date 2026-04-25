# Working instructions

## Before each task

- Create a new branch according to Conventional Commits rules.

## During work

- Update the application version according to SemVer (MAJOR.MINOR.PATCH), and independently identify the change type based on the diff, task description, changelog, and compatibility impact.
- For every task that changes repository files, update the version in all version sources and visible app surfaces in the same PR/commit. At minimum check `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md`, and any hardcoded UI version labels such as `index.html`.
- Do not leave the displayed application version behind the package version. If the UI shows a version string, it must match the SemVer version selected for the task.

Increase PATCH (0.0.x, 1.2.x) when the change concerns only bug fixes, refactoring without public behavior changes, small UI fixes, or documentation without impact on the API and business logic.

Increase MINOR (0.x.0, 1.x.0) when you add backward-compatible new functionality, a new endpoint, a new optional field, a new screen, a new integration, or mark an element as deprecated without breaking existing behavior.

Increase MAJOR (x.0.0) when the change breaks compatibility, for example by removing or changing a public endpoint, changing the data contract, required fields, parameter names, existing function behavior, or the client-side integration method.

After increasing MINOR, reset PATCH; after increasing MAJOR, reset MINOR and PATCH.

If the project is still in the MVP stage or has an unstable API, use version 0.y.z; still identify changes as fix / feature / breaking, but keep the major number at 0 until the product is considered stable.

## After completing a task

- Review the changes.
- Create/update `CHANGELOG.md`.
- Update docs if needed.
- If everything is [OK]:
  - Ensure the version has already been updated everywhere it is stored or displayed.
  - Open a PR - `git add .`, `git commit -m "feat/minor/fix/breaking: [short description]"` with the appropriate SemVer prefix.
  - Push to the branch and create a PR with a link.
  - Provide the PR link in the summary.
  - Confirm the updated version in `package.json` / `Dockerfile` / `Chart.yaml` and any app UI labels according to SemVer.
- If [NG]:
  - Describe the specific problem (build error, tests NG, linter, missing tests).
  - Provide the error logs (last 10 lines).
  - Propose a fix or wait for feedback.
  - **DO NOT create a PR** with errors.
