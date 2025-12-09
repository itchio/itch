# Changelog

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
