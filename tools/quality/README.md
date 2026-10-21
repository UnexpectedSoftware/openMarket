# Quality tools

Vendored copies of Uncle Bob's multi-language quality tools, customized for OpenMarket (plain JS + JSDoc).
Each tool keeps its upstream `LICENSE` (0BSD) and `README.md`. They need Python 3.11+; the wrapper script
creates a `.venv` inside the tool folder on first run (ignored by git).

| Tool | What it does | Upstream | Vendored commit |
|---|---|---|---|
| `crapper/` | CRAP = CC² × (1 − coverage)³ + CC, per function, from lcov | https://github.com/unclebob/crapper | `6fd92c4c9bcc56efb64a2f8743d5a2993bcfd42d` |
| `dryer/` | Structural duplicate detection (Jaccard of AST fingerprints) | https://github.com/unclebob/dryer | `66ff6d21a42c04afcad89c78a80066176d1294b0` |
| `mutator/` | Mutation testing (runs `npm test` per mutant) | https://github.com/unclebob/mutator | `c57f03879a08d2afe8c7e044e86c80bb164afd30` |

`mutator` imports `crapper` from the sibling folder (`../crapper`), so keep them side by side.

## Local changes

- `dryer`: reads `.js`, `.jsx`, `.mjs`, `.cjs` with the tree-sitter JavaScript grammar (upstream only reads
  TypeScript extensions; see `dryer/openmarket.patch`), and defaults are `--threshold 0.9 --min-lines 8
  --min-nodes 80` so small DI constructors are not reported.
- `crapper` and `mutator`: unchanged.

## Usage (from the repo root)

```bash
npm run crap                 # c8 coverage (lcov) + CRAP table, worst first; writes .metrics/crap.edn
npm run crap -- --changed    # only files added/modified in git status
npm run dry                  # duplication candidates in src/openMarket; writes .metrics/dry.edn
npm run dry -- --changed
npm run mutate -- src/openMarket/domain/order/Order.js   # one file at a time; exit 3 if a mutant survives
```

`npm run mutate` reads the existing `coverage/lcov.info`, so run `npm run coverage` first. CI runs `crap`
and `dry` as a report-only `quality` job; mutation testing is local only.

To update a tool, copy the upstream tree over its folder (without `.git`), re-apply `dryer/openmarket.patch`
and the dryer defaults in `dryer/src/dryer/cli.py`, and update the commit table above.
