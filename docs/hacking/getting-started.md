
## Setting up itch for development

itch is built in HTML/SCSS/TypeScript and runs inside of Electron. Install the
following to get started with development:

* Install [node.js][] (7.6 or newer)

[node.js]: https://nodejs.org/

Then, clone the <https://github.com/itchio/itch> repository somewhere.

Install the javascript dependencies by running this command from
within the `itch` directory you've just cloned:

```bash
$ npm install
```

> Note:
>
> For native modules, you'll need a compiler toolchain: Visual Studio 2015 on Windows, gcc/clang on Linux/macOS. See the [node-gyp](https://github.com/nodejs/node-gyp) page for
> more information on this.

Finally, start the app!

```bash
$ npm start
```

The first run will seem slow, because the compile cache is empty. Subsequent runs
will be much faster.

## Environment

There are three environments in which the app can run: `development`,
`test`, and `production`.

`development` is what you'll be using to develop the app. It's rather slow,
and includes a bunch of warnings and tools that aren't in the other environments,
such as:

  * Hot module reloading  
  * React warnings

`production` is what the app runs on when it's released as a package to end-users.
It's a fast, no-nonsense environment, and it enables things like self-updates, 
locale updates, etc.

`test` looks a lot like `production` except that some things are disabled: logging,
for instance, is suppressed. The app will also not exit by itself, but print
a well-known string to the console, allowing the integration test runner to kill the
app itself (spectron is picky like that).

### Development mode is slow

There's a few things slowing down the app in development, a big one is the amount
of checks that React does. If you want to get a feel for how fast the app could be
without all those extra checks and warnings, you can simply run:

```bash
NODE_ENV=production npm start
```

Note that, in production, a bunch of developer tools are not available.

## App structure

Electron apps have two sides:

  * what happens in the `node.js` process, which we call **metal**
  * what happens in the `chromium` processes, which we call **chrome**

In **metal** we have filesystem operations, API requests, executing external
binaries, showing native notifications, and so on. In **chrome** we have all
the UI code, based on React.

Each side has a redux store, the **metal** store is the reference, and the
other store(s) are synchronized by sending inter-process messages, which
is done transparently by redux-electron-store.

For more on the dual-process nature of Electron apps, read the [Data flow](data-flow.md) page.

## Developer tools & environment variables

Press `Shift-F12` to open the Chromium developer tools, to inspect the DOM,
run arbitrary javascript code in the **chrome** side of the app, etc. If
the app crashes before it gets a chance to install the keyboard shortcut,
you can `export DEVTOOLS=1` before starting the app so that they open as
early as possible.

It's also possible to get *some* of the Chromium developer tools for the **metal**
side of the app:

  * start the app (in development environment)
  * open a Google Chrome tab, navigate to `chrome://inspect`
  * click `inspect` on the relevant `Remote Target`

Finally, some environment variables change the behavior of the application, there's a list in [environment-variables.md](environment-variables.md)

> Tip: 
>
> When running from msys, `export OS=cygwin` to see log output

## Compiling

TypeScript sources and static assets live in `src`.

In development, files are built as they're required, by [electron-compile](https://github.com/electron/electron-compile).

In production, they're precompiled with the `compile` script in `package.json`.

### Live reload / Hot module reload

When the app is started in developent, it watches for file changes, and reloads
parts of itself automatically. This mostly applies to the **chrome** side of the app,
components in particular.

By having your code editor and the app open side to side, you can quickly iterate
on the looks of a React component.

### The .cache folder

If you run `npm run compile`, all files will be compiled and put into a cache folder
named `.cache`.

This normally happens on the Continuous Integration servers when a new release of
the app is prepared.

There is a catch: if the app detects a `.cache` folder, it will be in `read-only` mode:
no matter how much the source files changed, the app will only ever run from the
already-compiled files in the `.cache` folder.

If you run the app in development (the default) and it detects a `.cache` folder, it
will print a warning letting you know that changes won't be picked up (even when
restarting the app).

> There's really no reason to run `npm run compile` locally. If you see a `.cache`
> folder, remove it.

In development, the cache folder is somewhere in `$TEMP` or `$TMPDIR` or `/tmp/`.
On Linux, it's often `/tmp/$(whoami)/compileCache_{hash}`. While `electron-compile`
should normally not cause any issues, if you do want to clear the development
compile cache, just remove the whole folder (preferably while the app is *not running*).

## Code style

We use [prettier](https://www.npmjs.com/package/prettier) to make sure the
codebase has a consistent style.

There's a pre-commit hook that formats staged files. It's powered by husky
and [lint-staged](https://github.com/okonet/lint-staged), see the `package.json`
for the configuration.

Some text editors have plug-ins for prettier, which can help you format
on save. There are workspace settings for the [Visual Studio Code prettier plug-in](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) in the repository.

### Casing

`camelCase` is used throughout the project, even though the itch.io
backend uses `snake_case` internally. As a result, for example,
API responses are normalized to camelCase.

### Logging

Logging is done via [pino](https://github.com/pinojs/pino). Each module for which
it makes sense to have a certain amount of logging (for example, detailing the
install process of a game, etc.) should get its own child logger, like so:

```typescript
import rootLogger from "../logger";
const logger = rootLogger.child({ name: "my-cool-module" });

// then, later in the code
logger.error("This shows up in red");
logger.warn("This shows up in yellow");
logger.info("This shows up in white");
logger.debug("This only prints if export ITCH_LOG_LEVEL=debug");
```

### Asynchronous code

We use TypeScript's async/await support so that instead of writing this:

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

...we can write this:

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

Currently, async/await code is transformed using babel to bluebird promises,
which in turn uses coroutines and has long stack traces support.

This lets us dive into issues that involve several promises awaiting each
other. In the future, native node promises will also have great stack trace
support, and we won't have to go through bluebird or use babel anymore.

### React components

React components are TypeScript classes that extend `React.PureComponent`. All
components are pure components, never extend `React.Component` instead.

We have our own `connect` flavor that does state mapping and dispatch mapping,
and adds `t` (in the `I18nProps` interface) for i18n.

Look at `src/components/basics/` for simple examples.

### Styled components (CSS)

Most of the CSS styles in the app are handled by [styled-components](https://github.com/styled-components/styled-components).

This lets us handle theme switching, namespace and compose our styles easily.

Some text editor plug-ins, like [styled-components for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=jpoissonnier.vscode-styled-components) provide syntax highlighting for
css blocks.

## Testing

### Unit tests

All unit tests are run directly within electron, never vanilla node.js.

Run `npm test` to run unit tests once. Those should be pretty fast.
The output of unit tests is minimal, it should only become noisy when some
tests fail. The inspiration comes from [tap-pessimist](https://github.com/clux/tap-pessimist).

Run `npm test -- --watch` to re-use the same electron instance to run
tests as soon as a source file is changed. If you're running Visual Studio code,
the `test` task does exactly that.

The unit tests for `a/module.ts` live in `a/module.spec.ts`. This allows
one to switch quickly between a file and its test, for example using the
[Toggle Spec plug-in for Visual Studio](https://marketplace.visualstudio.com/items?itemName=simplysh.toggle-spec).

The test harness we use is a spruced-up version of [substack/tape][], named
[zopf][]. It's basically the same except it integrates with sinon (for mocks/stubs/etc.)
and groks async tests/cases.

[substack/tape]: https://github.com/substack/tape
[zopf]: https://github.com/itchio/zopf

### Coverage

Running unit tests collects coverage data in the `coverage/` directory.

Using an lcov-compatible tool, like the [Coverage Gutters for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters)
allows you to see coverage data directly in your text editor.

The Continuous Integration servers also collect coverage data, then upload it
to [our codecov page](https://codecov.io/gh/itchio/itch).

### Integration tests

Integration tests https://www.npmjs.com/package/spectron