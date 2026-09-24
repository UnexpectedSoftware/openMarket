# OpenMarket

Desktop application to administrate a generic market: stock, products, categories, and orders.

The domain is organized as DDD with a hexagonal layout: `domain/`, `application/`, `infrastructure/`, and `user_interface/`.

## Requirements

Node.js 24 or newer (the app also runs on the current Node 26) and npm. Electron 44 ships its own Node for the window.

```bash
git clone https://github.com/UnexpectedSoftware/openMarket.git
cd openMarket
npm ci
```

`.npmrc` sets `legacy-peer-deps` because the UI still uses React 15, and a few of those packages now declare newer peers. The versions installed are the ones the current code calls.

## Run it locally

Development uses the LocalStorage repositories and the fixture data in `src/resources/fixtures/`:

```bash
npm run dev
```

That starts the webpack middleware on port 3000 and opens the Electron window with hot reload.

To open the production bundle against the same LocalStorage data:

```bash
npm run build
npm start
```

`npm start` sets `OPENMARKET_STORE=LocalStorage`. A packaged build that does not set that variable uses the production config in `src/resources/application-pro.json`, which points at MySQL (`localhost`, database `tienda`).

## Tests

```bash
npm run test-all
```

Unit tests mock MySQL. Integration tests run the use cases against LocalStorage. No database is required.

## Packaging

A push to `master` runs the tests, then builds installers and publishes them as one GitHub Release:

- Linux x64: `.deb` and `.AppImage`
- Windows x64: NSIS `.exe`
- macOS: universal `.dmg` and `.zip` (Intel and Apple Silicon)

The tag is `v<version>-<short sha>`, for example `v0.0.1-a3523fa`. The file name carries the same version, OS, and architecture. The running window shows that same tag at the right of the header, so you can match an open copy to the release. A checkout that was not stamped shows the package version plus the current commit. These builds are unsigned, so Windows SmartScreen and macOS Gatekeeper warn on first launch.

To build the installer for the machine you are on:

```bash
npm run package-linux
npm run package-win
npm run package-mac
```

`package-mac` runs on macOS. `npm run package` builds the current platform only.

## Not in this pass

These stayed on the APIs the current screens and tests already use:

- React 15, React Router 3, Redux 3, redux-form 6, redux-observable 0.14, RxJS 5
- react-table 6, react-datepicker 0.48, chart.js 2

Still to do later: React 18 and React Router 6, RxJS 7, a preload script instead of `nodeIntegration`, Flow, and an ESLint cleanup.
