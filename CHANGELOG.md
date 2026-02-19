# Changelog

## [26.8.0-canary] - 2026-02-18


This release upgrades from Electron 33 to Electron 40 and adds a large set of UI and sandboxing improvements, including a reintroduced in-app changelog dialog.

**macOS 11 (Big Sur) is no longer supported. macOS 12 (Monterey) or later is now required.**

### Electron

- Upgrade from Electron 33 to Electron 40 ([#3382](https://github.com/itchio/itch/issues/3382))
- Minimum supported macOS version is now 12 (Monterey)
- Linux now defaults to native Wayland in Wayland sessions
- Updated esbuild targets to Node 24 and Chrome 144 to match Electron 40

### Install

- Refactored install planning to split install target listing (`Install.GetUploads`) from per-upload planning (`Install.PlanUpload`). Due to how the app computes space requirements, it may take some time as our CDN warms up cold files. For this reason we made the size calculation happen asynchronously so you can queue an install immediately without having to wait for install size calculation to complete.
- Added cancellation support for in-flight install planning requests when changing upload or closing the modal

### Linux Sandboxing

- Added new Bubblewrap sandbox backend with user-namespace isolation, a persistent per-game home directory, read-only system mounts, and GPU, audio, and display passthrough
- Added Flatpak-spawn sandbox backend for running sandboxed games when itch is installed as a Flatpak
- Updated Firejail backend with network disable support, an expanded blacklist covering sensitive paths (~/.ssh, ~/.gnupg, ~/.aws, browser data), and environment variable filtering consistent with the new backends
- Auto-detection selects the best available backend: Flatpak-spawn when inside Flatpak, otherwise Bubblewrap if available, with Firejail as fallback
- New sandbox preferences under Security & privacy: sandbox type dropdown (`Auto`, `Bubblewrap`, `Firejail`), "Disable network access in sandbox" toggle, and allowed environment variable names input
- Strict environment variable allowlist: only display, audio, session, and itch.io-specific variables are passed through, with user-configurable additions via preferences

### Changelog Dialog

- Reintroduced the in-app changelog dialog
- Added release tabs for `itch`, `butler`, and `itch-setup`

### UI & Accessibility

- Added more semantic HTML and ARIA labels across controls (navigation buttons, game management actions, progress indicators, sidebar navigation)
- Game cover images now include alt text
- Updated cave version selection rows to semantic buttons
- Fixed tab list scrollbar rendering issues ([#3384](https://github.com/itchio/itch/issues/3384))
- Improved login form alignment and spacing

### Documentation

- Reviewed the itch docs and modernized many pages. https://itch.io/docs/itch/

## [26.7.0-canary] - 2026-02-10

This release upgrades from Electron 25 to Electron 33. **macOS 10.15 (Catalina) is no longer supported** macOS 11 (Big Sur) or later is now required.

This is release is made available as an intermediate for upcoming Electron to allow for us to bisect for any issues.

### Electron

- Upgrade from Electron 25 to Electron 33 ([#3382](https://github.com/itchio/itch/issues/3382))
- esbuild target updated to Node 20 and Chrome 130 to match Electron 33
- Updated `openAsHidden` login item setting to only apply on Windows (removed from macOS in newer Electron)

### Other

- Changed app ID from `com.squirrel.itch.itch` to `io.itch.itch`
- Disabled remote locale fetching (locales.itch.zone no longer exists)


## [26.6.0] - 2026-02-06

First stable release since v26.1.9, includes all changes from v26.2.1-canary, v26.3.0-canary, v26.4.0-canary, and v26.5.0-canary.

Highlights: native Apple Silicon support, new OAuth login flow, full migration from GitLab CI to GitHub Actions, Electron 22 to 25 upgrade, Webpack to esbuild migration, semantic HTML accessibility improvements, and numerous bug fixes.

See the [GitHub release](https://github.com/itchio/itch/releases/tag/v26.6.0) for full details.

## [26.5.0-canary] - 2026-02-05

This is the first version of the app to officially support arm64 on macOS (aka Apple silicon)! The auto-updater will automatically pull the arm64 version for those on Apple silicon. No separate reinstallation necessary. All supplemental binaries (butler, itch-setup) will also automatically be replaced with their arm64 equivalent. The app should now start faster, be faster, and have less impact on your battery since it no longer needs to run through emulation on modern macOS computers.

This version of the app also includes our new OAuth login flow. We plan to retire username & password login in the app in favor of an OAuth login that requires a browser to complete the login. Unfortunately API endpoints that allow someone to authenticate via a username & password are prime targets for [credential stuffing](https://en.wikipedia.org/wiki/Credential_stuffing) attacks. Our previous solution to this was to add a captcha in the app, but it broke more often than not, as electron is not a regular browser.

The OAuth login is now the default screen. Username & password will remain available as a secondary option until we verify that people don't have any issues logging in.

### arm64 Notes

Because the app is booted by itch-setup, we decided to remove the *universal* build of the electron app we published with the last canary version. itch-setup will pick the version of the app that is correct for your system, so it's not necessary to download an app that is 2x the size that runs on both intel and arm64. (We do provide universal builds on the [kitch installation program](https://itchio.itch.io/install-kitch) though)

This update also completes our major refactor and migration of our CI system to GitHub Actions. All executables are now built, signed, notarized, and deployed through a GitHub actions workflow. We look forward to adding support for arm64 Windows and Linux in future updates now that we have completed the foundation.

With the new CI we are fully retiring all 32 bit binaries that we used to publish. Many of these were already not being updated anymore, but we'll be removing the download links entirely from broth.

### Build System & CI

- macOS signing and notarization done on GitHub Actions via separate job (new `release/sign-macos.js`)
- Windows code signing via Azure Code Signing in CI
- Separate macOS x64 and arm64 builds (removed `@electron/universal`, builds are no longer merged into a universal binary)
- Tagged builds are published to itchio via butler through GitHub Actions
- Restored integration test workflow on GitHub Actions
- Removed GitLab CI references, fully migrated to GitHub Actions
- Use tarballs for artifact transfer to preserve symlinks and permissions
- Upgraded `@electron/packager` v18 to v19, `@electron/notarize` v2 to v3
- No longer installs external npm dependencies during packaging (dependencies are bundled by esbuild)

### Login

- New OAuth login flow with PKCE as the default login method
- Password login still available as a fallback ("Log in with password" link)
- OAuth callback handled via `itch://oauth-callback` protocol
- Manual code paste fallback for when the browser redirect doesn't work
- New butlerd message: `Profile.LoginWithOAuthCode`

### React & Dependencies

- Upgrade React 16 to React 17
- Upgrade styled-components to 5.3.11
- Added typed Redux hooks (`useAppDispatch`, `useAppSelector`)
- Many class components converted to functional components with `React.memo`
- Replaced `react-container-dimensions` with built-in `ContainerDimensions` component using `ResizeObserver`
- Removed `rimraf` dependency (use native `fs.rm`)
- Removed `RandomSvg` component (unused)
- Removed `recursive-copy` dev dependency

### UI Improvements

- Broth component in preferences now expandable, showing executable path, version, directory, stage, source channel
- Playtime duration tooltips now show precise hours/minutes/seconds on hover
- Remembered profiles layout improvements

### Accessibility

- We did a pass over all clickable button like elements to ensure that they use semantic HTML elements like <button> to ensure that they can be navigated to and activated with a keyboard
- Icons now have `role="img"` and `aria-label` for screen readers
- Search results use standard `scrollIntoView()` for keyboard navigation instead of deprecated `scrollIntoViewIfNeeded()`
- Remembered profiles use flexbox layout instead of absolute positioning, improving tabbing order

### Platform

- macOS: proper arm64 architecture detection for broth packages (no longer hardcoded to amd64)
- macOS: binary architecture validation — re-downloads amd64 binaries on arm64 Macs
- Broth package state now tracks download channel

### Other

- Updated localization strings (Farsi, Chinese Simplified, Indonesian, Italian, and others)

## [26.4.0-canary] - 2025-12-08

### Build System
- Add arm64 and universal builds to GitHub Actions
- Add @electron/universal for macOS universal binary support
- Clean build artifact names published to the GitHub release

## [26.3.0-canary] - 2025-12-08

**Note**: Due to modern Windows signing requirements we'll likely be migrating
the entire build system to GitHub actions. Right now we're doing builds in
parallel to work out the details. Currently no builds uploaded to GitHub
releases are signed or notarized

### Build System
- Migrate from Webpack to esbuild
- Remove happypack dependency
- Migrate release scripts to ES modules
- Upgrade electron-packager to @electron/packager (v17 to v18)
- Set up GitHub Actions for building and deploying
- Update TypeScript to latest version
- Add production minification and metafile generation for bundle analysis

### Electron
- Upgrade to Electron 25
- Update protocol registration method

### Dependencies
- Migrate to @itchio/butlerd
- Remove `url` module dependency in renderer (use browser builtins)
- Remove `util` package dependency in renderer
- General dependency cleanup

### Accessibility
- Modal dialogs now use semantic `<dialog>` element with focus trapping ([#3292](https://github.com/itchio/itch/issues/3292))
- Buttons and links migrated to semantic HTML elements
- Remove "draggable" attribute from modal dialogs

### Bug Fixes
- Allow refreshing the app's UI again, instead of opening it in your system browser
- Fix missing uninstall dialog title
- Fix button behavior and login form submit handling
- Include architecture in user agent string

### Other
- Update screenshots
