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

The app stores the shop in an embedded SQLite file, `openmarket.sqlite`, in Electron's user-data directory. Development, `npm start`, and a packaged install all use that file. The first `npm run dev` fills it, when it has no categories, with generated categories, products, and a week of orders. Later launches leave the file alone, so an installed app with an empty file starts empty.

```bash
npm run dev
```

That starts the webpack middleware on port 3000 and opens the Electron window with hot reload.

To open the production bundle against the same file:

```bash
npm run build
npm start
```

## Tests

```bash
npm run test-all
```

Unit tests cover the services and SQLite repositories. Integration tests run the use cases against a temporary SQLite file. No database server is required.

## Packaging

A push to `master` runs the tests, then builds installers and publishes them as one GitHub Release:

- Linux x64: `.deb` and `.AppImage`
- Windows x64: NSIS `.exe`
- macOS: universal `.dmg` and `.zip` (Intel and Apple Silicon)

The release tag is `v` plus the `version` in `package.json`, for example `v1.1.0`. The installer name carries that version, the OS, and the architecture. The running window shows the same number at the right of the header. The AppImage uses a static runtime, so it does not need FUSE 2. Before a release is published, CI launches each installer and checks that the window loads. A merge does not change the number. The pull request says `Version: patch`, `minor`, `major`, or `none`, and `package.json` has to match that choice. These builds are unsigned, so Windows SmartScreen and macOS Gatekeeper warn on first launch.

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
