# itch

![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)
![Built with love](https://img.shields.io/badge/built%20with-%E2%9D%A4-FF8080.svg)
[![build](https://github.com/itchio/itch/actions/workflows/build.yml/badge.svg)](https://github.com/itchio/itch/actions/workflows/build.yml)
[![Translation status](https://weblate.itch.zone/widgets/itchio/-/itch/svg-badge.svg)](https://weblate.itch.zone/engage/itchio/?utm_source=widget)

The goal of this project is to give you a desktop application that you can
download and run games from [itch.io](http://itch.io) with. Additionally you
should be able to update games and get notified when games are updated. The
goal is not to replace the itch.io website.

## Screenshots

![](https://static.itch.io/images/app/collections@1x.png)

![](https://static.itch.io/images/app/gamepage@1x.png)

![](https://static.itch.io/images/app/install@1x.png)

## Downloads

You can download it from <https://itch.io/app>, see [Installing the app](https://itch.io/docs/itch/installing/) for
detailed instructions.

If you'd like to develop the app instead, read the [Getting Started][developing] page of the developer guide.

[developing]: https://itch.io/docs/itch/developing/getting-started.html

## Development Quick Start

```bash
# Install dependencies
npm install

# Start the app in development mode (watches for changes and rebuilds)
npm start

# Type check the project
npm run ts-check

# Build assets
npm run compile

# Use a local/development version of butler instead of the bundled one
BROTH_USE_LOCAL=butler npm start
```

## App Architecture

The itch desktop app consists of three components working together:

```
┌─────────────────────────────────────────────────────────────┐
│                    itch (Electron App)                      │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │   Main Process      │    │   Renderer Process         │  │
│  │   (Node.js)         │◄──►│   (React)                  │  │
│  │                     │    │                            │  │
│  │ • State (Redux)     │    │ • UI components            │  │
│  │ • Reactors          │    │ • User interactions        │  │
│  │ • Process mgmt      │    │ • State display            │  │
│  └──────────┬──────────┘    └────────────────────────────┘  │
└─────────────┼───────────────────────────────────────────────┘
              │ TCP/RPC
              ▼
┌─────────────────────────────┐   ┌───────────────────────────┐
│         butler              │   │       itch-setup          │
│       (Go daemon)           │   │     (Go executable)       │
│                             │   │                           │
│ • Game downloads/installs   │   │ • App installation        │
│ • Launch management         │   │ • Self-updates            │
│ • SQLite database           │   │                           │
└─────────────────────────────┘   └───────────────────────────┘
              ▲                              ▲
              └──────── broth.itch.zone ─────┘
                    (binary distribution)
```

### itch (This Repository)

An Electron app with a multi-process architecture:

- **Main Process**: Handles state management (Redux), business logic, and coordination with butler/itch-setup. Uses a "reactor" pattern to handle side effects from Redux actions.
- **Renderer Process**: React-based UI with state synchronized from the main process via electron-redux.

### butler

A Go daemon ([itchio/butler](https://github.com/itchio/butler)) that handles all game operations:

- Downloads, installs, updates, and launches games
- Maintains a SQLite database for installation data
- Communicates with itch via TCP-based RPC
- Spawned as a child process, tied to itch's lifecycle

### itch-setup

A Go executable ([itchio/itch-setup](https://github.com/itchio/itch-setup)) for installation and updates:

- Handles initial app installation on all platforms
- Manages self-update checks and restarts

### Version Management (broth)

The itch app automatically manages butler and itch-setup versions through the
"broth" system. Broth is a service we run that proxies over the itch.io API to
provide fixed download URLs for binaries & assets related to the itch app.

**Remote Distribution:**
- Binaries are hosted at `https://broth.itch.zone/{package}/{platform}/{version}`
- Platform format: `{os}-{arch}` (e.g., `linux-amd64`, `darwin-arm64`, `windows-386`)

**Local Storage** (eg. `~/.config/itch/broth/` on Linux):
```
broth/
├── butler/
│   ├── versions/{version-hash}/butler    # Extracted binary
│   ├── downloads/                        # Temporary during download
│   └── .chosen-version                   # Currently active version
└── itch-setup/
    └── [same structure]
```

**Version Selection:**
- Uses semver constraints defined in `src/main/broth/formulas.ts`:
  - butler: `^15.20.0`
  - itch-setup: `^1.8.0`
- Fetches `/versions` endpoint and picks the newest version satisfying the constraint
- Canary builds use `-head` channels with no constraints (always latest)

**Upgrade Flow:**
1. On startup, validates `.chosen-version` against installed marker
2. If app version changed since last run, checks for new component versions
3. Downloads zip, extracts with CRC32 verification, runs sanity check
4. Updates `.chosen-version` and cleans up old versions

**Development Override:**
```bash
# Use locally-built butler instead of managed version
BROTH_USE_LOCAL=butler npm start
```

Key source files: `src/main/broth/package.ts`, `src/main/broth/formulas.ts`, `src/main/broth/manager.ts`

## License

itch is released under the MIT License, see the [LICENSE][] file for details.

[LICENSE]: LICENSE

## Other relevant projects

Here are some other apps people have started:

### Android
* [Mitch](https://gardenapple.itch.io/mitch)

