# OpenMarket
[![Build Status](https://travis-ci.org/UnexpectedSoftware/openMarket.svg?branch=master)](https://travis-ci.org/UnexpectedSoftware/openMarket)
Desktop application to administrate a generic market with stocks, products, categories etc...

## Requirements

To clone and run this repository you'll need Git and Node.js (which comes with npm) installed on your computer. From your command line:

```bash
    git clone https://github.com/UnexpectedSoftware/openMarket.git
    cd openMarket
    npm install
```

## Getting started

To start the application:

```bash
    npm run dev
```

## Packaging

To package apps for the local platform:

```bash
$ npm run package
```

To package apps for all platforms:

First, refer to [Multi Platform Build](https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build) for dependencies.

Then,
```bash
$ npm run package-all
```

To package apps with options:

```bash
$ npm run package -- --[option]
```

## Further commands

To run the application without packaging run

```bash
$ npm run build
$ npm start
```

To run Tests

```bash
$ npm run test-all
```
