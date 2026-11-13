---
name: om-finish
description: OpenMarket done-checklist. Use before saying a change is finished, before committing, or before opening or updating a PR - runs tests, typecheck, CRAP, duplication and mutation gates with low-noise output and checks the PR Version line.
metadata:
  short-description: OpenMarket finish gates
---

# Finish an OpenMarket change

Run what the change needs, in this order. Keep output short: pass the quiet flags shown and read the tail of a log instead of the whole thing.

1. Unit + architecture + contract tests: `npm test -- --reporter dot` (add `--grep "<Name>"` while iterating; run the full suite once at the end).
2. SQLite integration (repositories, use cases, fixtures changed): `npm run test:integration -- --reporter dot`.
3. Types: `npm run typecheck`.
4. CRAP: `npm run crap -- --changed`. No touched function over **30**; split it or add tests.
5. Duplication: `npm run dry -- --changed`; extract real duplication in your change.
6. Mutation (any `domain/` file changed): `npm run coverage` then `npm run mutate -- <file>`; kill every surviving mutant with a test.
7. UI flows changed: `npm run build && xvfb-run -a npx playwright test --reporter=line` (macOS: drop `xvfb-run -a`). Run only the touched spec first: `npx playwright test e2e/<name>.spec.js --reporter=line`.
8. New shop data the screens show: extend the matching `infrastructure/dev/demo*.js` builder and its test, then `npm run fixtures`.

Never weaken, delete or skip a test to pass a gate. If `architecture.spec.js` fails, fix the code, not its allow-lists.

## PR
- Body has exactly one `Version: none|patch|minor|major` line and `package.json` matches (CI `version-decision` checks it). Visible UI change is usually `minor`.
- Short, factual description; link the issue (`Closes #N`).
- UI PRs: before/after screenshots at 1366×768 (and 1024×700 for layout work).
