
The goal of this page is to understand why existing code has been written
this way, and how to write new code that fits in with the old one.

## Tree structure

Electron apps have two sides:

  * what happens in the `browser (node.js)` process, which we call **metal**
  * what happens in the `renderer (chromium)` process, which we call **chrome**

On metal, we have:

  * itch.io API requests
  * Installing dependencies (unarchiver, for example)
  * Driving downloads with butler
  * Launching applications
  * Showing native notifications, interacting with the OS shell, etc.

On chrome, we have:

  * Rendering the whole user interface
  * Showing HTML5 notifications
  * Sniffing the user's preferred language

These used to be separated in the source tree, but they no longer are,
because it's useful to share code between them sometimes (with two copies,
one on each side).

There's one store in metal, and one store per BrowserWindow in chrome.
The metal store is the reference, and the chrome ones are kept in sync
via IPC by [redux-electron-store][].

[redux-electron-store]: https://github.com/samiskin/redux-electron-store

## Building

TypeScript sources, sass sources and static assets live in `appsrc`.

In development, `webpack-dev-server` is used and serves what the **chrome** part of the
app uses.

You can use `npm run serve-chrome` to watch those files, rebuild them when needed, and
serve them from memory to `http://localhost:8009`.

The **metal** part is built on-disk into the `app` folder. You can do a one-off build with
`npm run build-metal`, or watch for changes and rebuild as needed with `npm run watch-metal`.

In production, everything is built on-disk into `app`.

## TypeScript usage and features

We try to use recent versions of TypeScript, to take advantage of new features.

### Async/await

We use TypeScript's async/await support to be able to write code that translates to coroutines:

Conceptually, it lets us write this:

```typescript
function installSoftware (name: string) {
  return download(name)
    .then(() => extract(name))
    .then(() => verify(name))
    .catch((err) => {
      // Uh oh, something happened
    });
}
```

...but like this:

```typescript
async function installSoftware (name: string) {
  try {
    await download(name);
    await extract(name);
    await verify(name);
  } catch (err) {
    // Uh oh, something happened
  }
}
```

## Code style

Our TSLint rules file is `tslint.json` - it should be easier to read it than
keep those docs up-to-date.

`tslint-loader` is in the webpack loader chain, so code is linted while developing,
on CI, and while generating production builds of the app.

Additionally, some editors have plug-ins to support real-time linting:

  * Visual Studio Code has a `TSLint` extension that does the job just fine.

### Casing

`camelCase` is used throughout the project, even though the itch.io
backend uses `snake_case` internally. As a result, for example,
API responses are normalized to camelCase.

Notable exceptions include:

  * SCSS variables, classes and partials are `kebab-case`
  * Source files are `kebab-case`
    * e.g. the `GridItem` content would live in `grid-item.tsx`
  * i18n keys are `snake_case` for historical reasons

## Testing

It's recommended to keep `npm run watch-tests` running, and use `npm run run-tests`
now and then to actually run the tests.

The test harness we use is a spruced-up version of [substack/tape][], named
[zopf][]. It's basically the same except it integrates with sinon (for mocks/stubs/etc.)
and groks async tests/cases.

[substack/tape]: https://github.com/substack/tape
[zopf]: https://github.com/itchio/zopf

## React components

React components are TypeScript classes that extend `React.Component`.

One file = one component, as default export.

We have our own `connect` flavor that does state mapping and dispatch mapping,
and adds `t` (in the `I18nProps` interface) for i18n.

Look at `appsrc/components/proxy-settings.tsx` for a good example.
