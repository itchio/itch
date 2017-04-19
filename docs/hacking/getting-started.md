
## Installing

itch is built in HTML/SCSS/TypeScript and runs inside of Electron. Install the
following to get started with development:

* Install [node.js][] (7.6 or newer)
* Install [yarn][]

[node.js]: https://nodejs.org/
[yarn]: https://yarnpkg.com/en/

* Check out this repository

* Install the javascript dependencies by running this command from
within the `itch` directory you've just cloned:

```bash
$ yarn install
```

(For native modules, you'll need a compiler toolchain: Visual Studio 2015 on Windows, gcc/clang on Linux/macOS)

* Start the app!

```bash
$ npm start
```

### Running tests

Run:

```bash
$ npm test
```

### Debug facilities

**:memo: When running from msys, `export OS=cygwin` to see log output**

These keys do things:

  * `Shift-F5` — reload the UI. Since the state is stored outside of the browser,
    this shouldn't corrupt
  * `Shift-F12` — open Chromium developer tools, to inspect the DOM, run arbitrary javascript code, etc.

Some environment variables change the behavior of the application, there's a list in [environment-variables.md](./environment-variables.md)

[diego]: diego.md
