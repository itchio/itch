# Changelog

## [26.19.0] - 2026-08-31

This release adds a Steam shortcuts manager, a method for linking downloads you already have on disk to your library, and a UI refresh over many shared components of the app. Electron has been updated to version 44, and we did a round of security hardening and code and dependency cleanup.

### Steam shortcuts

We've introduced a new tool to manage shortcuts within Steam for projects installed in itch ([#3313](https://github.com/itchio/itch/issues/3313)). You can now make things installed in itch appear in Steam, allowing you to run itch games without having to change apps when using Steam Deck or Steam Big Picture mode. You can find it either in the preferences, or by right clicking on any game cover image.

Shortcuts are added to an "itch.io" collection in Steam so they are grouped. For compatibility reasons, we have two launch modes available: launching through the app, which records play time on your profile, or "direct" mode, which points Steam at the game's executable so it runs without the app

### Launching games in *headless* mode

Games can now be launched without the app running using `itch-setup --run-game <gameId> [--profile-id <profileId>]`. We introduced this primarily for the Steam shortcuts functionality, but it can be used for any other launcher or shortcut system.

This is built on a new `butler launch` subcommand that runs the launch machinery in-process against an existing `butler.db` without the need for a daemon process. `itch-setup` handles the app-specific parts: it locates your app's installation and settings, and generates and executes the corresponding `butler launch` command to start the game. Executables launched this way will preserve all app settings and per-game launch options, supporting sandboxing, prerequisates, play time tracking, API key, etc..

Not every launch can run this way. HTML5 games need a browser window, soundtracks and books need the OS shell, and an unaccepted license or a failed prerequisite install needs a client to prompt the user. For cases when `itch-setup` can't start the game directly, the full app is started or brought to the foreground on the associated game's launch dialog.

> macOS is not supported yet, Steam shortcuts can be used but will launch the app with a URL or direct executable

### Manually link pre-existing downloads to a game

If you've downloaded a game on itch.io outside the app, but want it to be registered within the app you can now use the "Link existing folder...". Consider this a power user tool, as no files are verified when you do this. This features exists as an escape hatch to get your games showing up in the app without having to redownload them, or if the game itself doesn't support a download that the app can process (like external download links). [#3493](https://github.com/itchio/itch/issues/3493)

### Misc changes

- The custom titlebar buttons have been replaced with native window controls ([#3496](https://github.com/itchio/itch/issues/3496))
- Downloads show progress on the taskbar
- Tabs mode: Tabs have a context menu with duplicate, close others, and close below ([#3489](https://github.com/itchio/itch/issues/3489))
- macOS: new icons matching the current platform style ([#3490](https://github.com/itchio/itch/issues/3490))
- macOS: the dock icon bounces when something needs attention
- Buttons were restyled and their sizes and margins made consistent across the app
- Checkboxes are styled instead of using the platform default
- Update the bundled font to fix vertical alignment issues on macOS
- Navigating between pages no longer flashes white
- Load translations sooner so that empty translation string keys don't flash when app is starting
- Add context menu item for pushing a new build for each game on the "My creations" page
- The app update dialog links to the release notes
- The downloads dialog shows richer information about what happened in the status message, eg. if a heal took place vs a reinstall
- Search autocomplete results return only games associated with the current profile, and not all games in the local db
- Support `ITCH_PROFILE_ID` environment variable to auto-login the app to specified profile when starting

### Browsing

- Shift+click and Ctrl+click on links are respected when opening pages in a new tab or window (tabs mode only for new tab)
- A Jams button was added to the new tab page
- Fixed the back and forward mouse buttons on macOS and Windows ([#3488](https://github.com/itchio/itch/issues/3488))
- Move all "Open in external browser" buttons off the address bar and into the *More* menu

### Security

- The app shell is served from an `itch-shell://` protocol instead of `file://`, and the CSP is served from a single place
- Webviews have a default permission list, and attaching a webview is guarded
- The Electron binary is now fused
- `--ignore-certificate-errors` is limited to dev builds

### Translations

Translation files use ICU syntax for placeholders and plurals to make it easier to support a wide range of localized plurals.

Thank you to all our contributors who contributed translations for this version. You can contribute on weblate: <https://weblate.itch.zone/projects/itchio/itch/>.

### Bugs

- Fixed a race condition when installing many games at once ([#3482](https://github.com/itchio/itch/issues/3482))
- Fixed text selection in dialogs after the move to `<dialog>`
- Fixed the log display in the scan library window
- The stop button in the browser navigation bar did nothing when clicked
- Fixed broken retry logic for broth downloads

## [26.18.0] - 2026-08-02

- Fix crash on launch on Apple Silicon Macs: 26.17.0 was signed without the `com.apple.security.cs.allow-jit` entitlement ([#3474](https://github.com/itchio/itch/issues/3474))

## [26.17.0] - 2026-07-28

This release adds per-game launch settings, lets you install downloads that aren't tagged for your platform, reworks the installed library page and the manage dialog, and rebuilds the sidebar search around your own library. It requires butler 15.30.0 or newer.

### Launch settings

- Each installed game now has a Launch settings screen, reachable from the manage dialog, with per-game sandbox, network access, and environment variable options ([#366](https://github.com/itchio/itch/issues/366), [#3102](https://github.com/itchio/itch/issues/3102))
- Introduces a "Command Pattern" launch options: support either plain arguments to add or a `%command%` pattern to add wrapper commands or environment variables ([#342](https://github.com/itchio/itch/issues/342), [#3238](https://github.com/itchio/itch/issues/3238), [#2713](https://github.com/itchio/itch/issues/2713))

### Installing

- Downloads that aren't tagged for your platform are now able to be revealed and intsalled. ([#3430](https://github.com/itchio/itch/issues/3430), [#3237](https://github.com/itchio/itch/issues/3237), [#3270](https://github.com/itchio/itch/issues/3270), [#2929](https://github.com/itchio/itch/issues/2929), [#2556](https://github.com/itchio/itch/issues/2556), [#2446](https://github.com/itchio/itch/issues/2446), [#2275](https://github.com/itchio/itch/issues/2275))
- `itch://install` accepts a `launch` parameter, which opens the launch dialog instead of reinstalling when the upload is already downloaded

### Search

The sidebar search has been replaced:
* Autocomplete candidates now only show locally available projects, eg. things you have bought, or synced from collections or bundles.
* Autocomplete results now include Collections and Bundles, making it easy to naviagte directly to the corresponding page in the app.
* There's now a *Search on itch.io...* option presented first that will take you to itch.io's full search page to search across the site.

This replaces the old API search autocomplete which presented items in a confusing order that made it hard to actually find anything. We feel that autocomplete works best for things you already have, and everything else should go through the site's full search experience.

### Library

- Installed items show install size, version, and play time inline, plus a manage button next to the main action
- The installed page can be sorted by last played, play time, size on disk, and install date, and filtered to games you've never played
- The content type filter is now a dropdown and includes soundtracks, game mods, and other ([#3421](https://github.com/itchio/itch/issues/3421))
- The manage dialog was redesigned around quick actions and no longer duplicates the install dialog, it links to it instead


### butler

- Requires butler 15.30.0 or newer
- Play time and last played are now tracked per profile. Play time recorded before this change is pulled from the server the first time your library refreshes

### Bugs

- Fixed a race condition where closing a dialog could dismiss the one it just opened


## [26.15.0] - 2026-07-07

This release adds a page for browsing and installing games from itch.io bundles you own, a platform filter on the collection, bundle, and library pages, accessibility improvements to the sort and filter dropdowns, and an Electron bump.

### Bundles

- Bundles you own now show up in your Library, each with its own page listing every game in the bundle
- The bundle page can be sorted, searched by title, and filtered by platform, classification, and installed status
- Games can be installed directly from the bundle page
- Requires a version of butler with bundle support

### Filtering

- Added a platform filter (Windows, macOS, Linux, Web) to the collection, bundle, and library pages

### Accessibility

- The sort and filter dropdowns are now keyboard and screen reader friendly, with combobox/listbox roles and arrow-key navigation

### Hotkeys

- Removed the `Ctrl+Alt+Backspace` shortcut that force-killed the last running game ([#3453](https://github.com/itchio/itch/issues/3453))

### Upload

- Fixed the file labels shown for builds that are still processing

### Electron

- Upgraded Electron from 42.1.0 to 43.0.0

## [26.13.0] - 2026-05-18

A follow-up to 26.12.0 with Upload page fixes and an Electron bump.

### Upload

- The source picker in the push dialog now has separate "Select folder" and "Select .zip" buttons, since a single file dialog can't pick both a folder and a file
- Fixed drag and drop of a source folder or `.zip` onto the push dialog, which broke when Electron removed the `File.path` property; the path is now resolved via `webUtils.getPathForFile`
- The build list toolbar now reflows for narrow window widths instead of overflowing

### Electron

- Upgraded Electron from 41 to 42.1.0

### Translations

- Synced translations

## [26.12.0] - 2026-05-14

A small follow-up to 26.11.0 that opens the Upload page to all users and surfaces information about optimized patches.

### Upload

- The Upload entry in the sidebar and the Upload tile on the new-tab page are now shown to everyone, not just kitch users
- When butler has finished producing an optimized patch for a build, the Upload page now reports the optimized patch size (instead of the original) with a bolt icon and a tooltip explaining what it is
- The per-build file list shows the original and optimized patches as separate entries, with the original listed first

### Security

- `npm audit fix` for transitive dependency advisories

## [26.11.0] - 2026-05-12

This release adds a UI for uploading builds to itch.io with butler without needing to drop down to the terminal, upgrades to Electron 41 and TypeScript 6, and includes a handful of accessibility, hotkey, and Linux autostart fixes.

This version of the app is linked to [butler version 15.27.0](https://github.com/itchio/butler/releases/tag/v15.27.0).

### Uploading builds with butler

A new "Upload" entry in the sidebar opens a Builds page that lists every build you've pushed with butler, with project, channel, version, status, size, and pushed time. The list can be filtered by status (All / Live / Processing / Failed) and searched by project, channel, or version. Each row expands to show per-file details (archive, patch, signature, manifest, unpacked), the build ID, the user who pushed it, the original `butler push` command, and an error message if the push failed.

A new push dialog lets you push a build by picking a project, picking or creating a channel (with an option to mark new channels as hidden), entering an optional user version, and dropping a folder or `.zip` as the source. Recent source folders are remembered and offered for re-use.

Before pushing, you can run a preview that compares the source against the latest build on the channel and shows the number of files that would be uploaded, the patch size, the source size, and the top new, modified, and deleted files.

While a push is running, you can track it with a live progress display showing the current phase (preparing, diffing, uploading, finishing), bytes read and uploaded, patch size, and ETA. System notifications are used to update you on the status of the build.


### New environment variable for launched games: `ITCHIO_APP=1`

Every program started via itch now has `ITCHIO_APP=1` set in its environment. Games can read this to detect that they were started by the itch.io desktop app.

### Login

- The OAuth login screen now has a "Browser didn't open?" disclosure that reveals the OAuth URL with a copy button, so the URL can be pasted manually in environments where the app can't open a browser.

### Hotkeys

- Added zoom in (`Ctrl/Cmd+=`), zoom out (`Ctrl/Cmd+-`), and reset zoom (`Ctrl/Cmd+0`) to the View menu ([#2305](https://github.com/itchio/itch/issues/2305), [#3099](https://github.com/itchio/itch/issues/3099))

### Linux

- Fixed several issues with `openAtLogin` / `openAsHidden` and `.desktop` file handling ([#3311](https://github.com/itchio/itch/issues/3311)):
  - The autostart `.desktop` file is now written to `$XDG_CONFIG_HOME/autostart` instead of `$XDG_CONFIG_HOME` directly
  - The installed `.desktop` file is now looked up in `$XDG_DATA_HOME/applications` and `/usr/share/applications`, instead of only `/usr/share/applications`
  - "Open as hidden" now actually starts the app hidden on autostart, by injecting a `--hidden` flag into the autostart copy's `Exec=` line; manual launches via menu or icon still show a window
  - The autostart `.desktop` file is no longer deleted on app startup when `openAtLogin` is its default-off value, so user-managed autostart files survive

### Bug Fixes

- Fixed prevent-sleep not engaging while a game is running, due to a null-check that was always falsy ([#2293](https://github.com/itchio/itch/issues/2293))
- Fixed the `Itch` object in HTML games not being exposed to the page; now uses Electron's `contextBridge` instead of the deprecated `webFrame.executeJavaScript` ([#3271](https://github.com/itchio/itch/issues/3271))
- Don't crash the React render when the saved locale code is invalid; locale codes are now normalized to BCP 47 (`pt_BR` → `pt-BR`) and validated via `Intl` before use, falling back to English on invalid values ([#2619](https://github.com/itchio/itch/issues/2619))
- Sidebar tab list now scrolls vertically when there are more tabs than fit, instead of clipping ([#3401](https://github.com/itchio/itch/issues/3401))
- Fixed the "disable network in sandbox" checkbox in preferences being toggled when clicking elsewhere in the surrounding row
- Fixed a bug where auto-update could get stuck cyling between items and never finishing any of them

### Accessibility

- The custom select dropdown (used for language, install location, sandbox type, and upload pickers) is now reachable by keyboard tab navigation and rendered as a real `<button>`

### Internals

- Upgraded Electron from 40 to 41
- Upgraded to TypeScript 6; removed the legacy `noImplicitAny: false` and `useUnknownInCatchVariables: false` compatibility flags
- Added a translation for butlerd error code 19000 so messages from butler surface as readable text instead of a raw code

### Translations

- Reworked the i18n sync script
- Fixed the Weblate project URL
- Synced translations

### Development

- Restored hot reloading on code changes; the renderer bundle is no longer cached across app refreshes
- `develop.mjs` no longer leaves the terminal in a broken state when the app is interrupted with Ctrl-C (runs `stty sane` on exit)

## [26.9.0] - 2026-02-20

This release upgrades Electron from 25 to 40, overhauls sandboxing across Linux, macOS, and Windows, makes install planning non-blocking, and adds support for compressed HTML game files.

**macOS 10.15 (Catalina) is no longer supported. macOS 12 (Monterey) or later is now required.**

### Electron

- Upgrade from Electron 25 to Electron 40 ([#3382](https://github.com/itchio/itch/issues/3382))
  - Minimum supported macOS version is now 12 (Monterey)
  - Linux now defaults to native Wayland in Wayland sessions
- Updated esbuild targets to Node 24 and Chrome 144 to match Electron 40
- Updated `openAsHidden` login item setting to only apply on Windows (removed from macOS in newer Electron)

### Game Installation

- Refactored install planning to split install target listing (`Install.GetUploads`) from per-upload planning (`Install.PlanUpload`). Due to how the app computes space requirements, it may take some time as our CDN warms up cold files. For this reason we made the size calculation happen asynchronously so you can queue an install immediately without having to wait for install size calculation to complete.
- Added cancellation support for in-flight install planning requests when changing upload or closing the modal
- Fixed quadratic operation in collection and library sync that could cause the app to lock up when synchronizing large collections
- Added hard limits on collection sync (2000 items) and owned keys (5000) to prevent excessive resource consumption

### Sandboxing

#### Linux

- Added new Bubblewrap sandbox backend with user-namespace isolation, a persistent per-game home directory, read-only system mounts, and GPU, audio, and display passthrough
- Added Flatpak-spawn sandbox backend for running sandboxed games when itch is installed as a Flatpak
- Updated Firejail backend with network disable support, an expanded blacklist covering sensitive paths (~/.ssh, ~/.gnupg, ~/.aws, browser data), and environment variable filtering consistent with the new backends
- Auto-detection selects the best available backend: Flatpak-spawn when inside Flatpak, otherwise Bubblewrap if available, with Firejail as fallback

#### macOS

- New balanced (strict, default) and legacy sandbox policy modes — legacy allows broader compatibility for problematic games
- Rosetta 2 support — x86 games can now run sandboxed on Apple Silicon Macs

#### Windows

- Fixed "access denied" error on first sandbox launch caused by ACL permission propagation delay
- Cryptographically secure sandbox account passwords

#### All Platforms

- Unified network disable control across all sandbox backends (Bubblewrap, Flatpak-spawn, Firejail, macOS, Windows)
- Per-cave sandbox override settings (sandbox type, network access, allowed environment variables)
- Per-cave extra command-line launch arguments
- New sandbox preferences under Security & privacy: sandbox type dropdown (`Auto`, `Bubblewrap`, `Firejail`), "Disable network access in sandbox" toggle, and allowed environment variable names input
- Strict environment variable allowlist: only display, audio, session, and itch.io-specific variables are passed through, with user-configurable additions via preferences
- Added warning about game save data when changing sandbox settings

### HTML Games

- Handle compressed HTML game files (gzip, brotli, .unityweb) before transferring to client, since protocol URLs do not support content encoding ([#3286](https://github.com/itchio/itch/issues/3286))
- Don't try to open non-HTTP links (like `about:blank`) in external browser ([#3394](https://github.com/itchio/itch/issues/3394))

### Changelog Dialog

- Reintroduced the in-app changelog dialog
- Added release tabs for `itch`, `butler`, and `itch-setup`
- Fixed changelog failing to load due to Content Security Policy restrictions by moving GitHub API fetch to main process IPC

### UI & Accessibility

- Added more semantic HTML and ARIA labels across controls (navigation buttons, game management actions, progress indicators, sidebar navigation)
- Game cover images now include alt text
- Updated cave version selection rows to semantic buttons
- Fixed tab list scrollbar rendering issues ([#3384](https://github.com/itchio/itch/issues/3384))
- Updated `react-tabs` to v4.3.0 with bundled types and added global tab styles
- Improved login form alignment and spacing
- Allow logs in log viewer to be copied and pasted ([#3000](https://github.com/itchio/itch/issues/3000))

### Bug Fixes

- Fixed Windows game launching broken by a Go runtime update
- Fixed macOS memory leak in file path resolution
- Fix log entries not showing up correctly in game crash dialog
- Fix TypeScript buffer type handling in memory streams

### Other

- Changed app ID from `com.squirrel.itch.itch` to `io.itch.itch`
- Disabled remote locale fetching (locales.itch.zone no longer exists)
- Use Node's built-in sourcemap support, removing `source-map-support` dependency
- Reviewed the itch docs and modernized many pages. https://itch.io/docs/itch/

## [26.8.0-canary] - 2026-02-18

This release upgrades from Electron 33 to Electron 40, adds Linux sandboxing overhaul, and breaks apart install planning phase so that it doesn't block installing a game.

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
- Updated `react-tabs` to v4.2.1 and added global tab styles
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
