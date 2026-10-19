# user_interface: rules for coding agents

React 15 + Redux 3 + redux-observable UI. Root `AGENTS.md` rules apply.

- **Design system:** read `docs/design/DESIGN.md` before changing components or styles, and follow the plan for the current phase in `docs/design/ROADMAP.md` / `docs/design/plans/`.
- **Skill:** use `.grok/skills/openmarket-design/SKILL.md` for the step-by-step workflow.
- Colours, spacing, type, radius and shadows: `var(--om-…)` tokens only, never hard-coded values.
- Use application use cases for writes and queries for reads, through the facade (`OpenMarket.get('<key>')`) from epics. The UI may import domain value objects (`Money`, `Quantity`, `VatRate`, `VatBreakdown`) and domain functions directly, for example to compute cart totals the same way `CreateOrder` does. Never import SQLite, fs, the container or infrastructure adapters.
- React 15: no hooks, Fragments or portals.
- UI PRs attach before/after screenshots at 1366×768.

## Unidirectional Redux flow (always on)

Every screen keeps its data in the Redux store and changes it only through actions. Use `order/new_order/` as the template. These are its files:

| File | Role |
|---|---|
| `model.js` | Screen state and the pure functions that change it: `state()` (initial state), `addProduct`, `updateQuantity`, `removeProduct`, `cartTotal`… Plain JavaScript with no React, Redux or RxJS. Domain value objects and functions (`Money`, `Quantity`, `VatRate`, `validateLine`) are allowed, since outer layers may depend on the domain. |
| `action.js` | Action type constants (`NEW_ORDER_SAVE`, `NEW_ORDER_SAVED`…) and action creators (`newOrderSave`, `newOrderSaved`…). Request/result pairs: the component dispatches the request, an epic dispatches the result. |
| `reducer.js` | `reducer(current = initialState(), action)`. Consumes actions and returns new state by calling `model.js` functions. Pure, so no I/O, no facade calls, no dispatch. Registered in `reducers/index.js`. |
| `Container.js` | The React 15 component. It renders props and calls the action creators it gets as props (`this.props.newOrderProductFetch(code)`). It never calls `OpenMarket.get`, use cases or queries. |
| `ReduxConnector.js` | `connect(mapStateToProps, mapDispatchToProps)(Container)`. `mapStateToProps` picks the screen's slice (`state.newOrder.*`); `mapDispatchToProps` uses `bindActionCreators` on `action.js` (and any other actions the screen needs). Routes and parents import this file, not `Container.js`. |
| `epicFactory.js` | Side effects as testable factories (`makeNewOrderSaveEpic(useCase)…(action$, store)`). On a request action: call a use case or query, then map the result (or a typed error) to **another** action. redux-observable with RxJS 5. |
| `epic.js` | Wiring: gets use cases and queries with `OpenMarket.get('<key>')`, builds the epics from `epicFactory.js` and exports them combined. Registered in `epics/index.js`. |
| Child components (`Cart.js`, `PaymentSheet.js`) | Presentational pieces rendered by `Container.js`. They receive data and callbacks as props. |
| Helpers (`input.js`) | Pure UI helpers (keyboard shortcuts, scanner-burst detection). No state, no dispatch. |

Small screens may merge `epicFactory.js` into `epic.js`; the roles stay the same.

```
 Container.js ──dispatch(actionCreator)──► store
      ▲                                      │
      │ props                                ├──► reducer.js ──(model.js)──► new state
 ReduxConnector.js ◄── mapStateToProps ──────┘
                                             │
                                             └──► epic ──► use case / query (OpenMarket.get)
                                                    └──dispatch(result action)──► reducer.js
```

Rules:

- Domain and screen data (lines, totals, lists, loaded records, loading and error status, selections that other parts react to, dialog results) live in the store. Don't keep them in component `setState`.
- `setState` is allowed only for purely visual, ephemeral state that nothing else reads and that can be lost on re-mount without harm: input focus, whether a dropdown or tooltip is open, a hover highlight. If in doubt, put it in the store.
- Components don't call the facade, use cases or queries. Epics do, and they always end by dispatching an action. Reducers never do I/O.
- Existing `this.setState` usage is not something to copy. Don't refactor it just for this rule; move it to the store when you change that screen.

New screen checklist:

1. `model.js`: `state()` and pure update functions (add unit tests).
2. `action.js`: types and creators, as request/result pairs for side effects.
3. `reducer.js`: delegates to `model.js`; register it in `reducers/index.js`.
4. `epicFactory.js` + `epic.js`: one epic per side effect, ending in a result or failure action; register it in `epics/index.js`. Unit test the factories with faked use cases (`Rx.Observable.of(...)`).
5. `Container.js`: render props, dispatch actions; `setState` only for ephemeral visual state.
6. `ReduxConnector.js`: `mapStateToProps` and `mapDispatchToProps`; route to this file.
