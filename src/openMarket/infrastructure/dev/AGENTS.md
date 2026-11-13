# infrastructure/dev/: demo fixtures

Demo data is written only by `npm run fixtures`, a standalone Node script with its own `FixturesContainer` (a `SettableClock` the saga sets to each ticket's time, the real sale-statistics subscriber, no plugin delivery). The app never imports this folder; an architecture test enforces it. The script replays the demo through the use cases in one transaction, so every row passes the domain invariants. No seed modes, swappable clocks or runtime switches in the app.

When a feature adds shop data the screens show (a table, a setting, a column), extend the builder for that aggregate and its unit test in the same change:

- `demoShop`: shop profile
- `demoSettings`: ticket, printer, theme, layout, language
- `demoCatalog`: categories and products
- `demoOrders`: tickets, payments, invoice numbers

New data goes through a use case in the saga (`FixturesService`), never SQL inserts. Progress output is a sync subscriber (`seedProgress.js`). Run `npm run fixtures` and check the screen that shows it.
