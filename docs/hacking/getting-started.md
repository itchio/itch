
## Installing

itch is built in HTML/SCSS/TypeScript and runs inside of Electron. Install the
following to get started with development:

* Install [node.js][] (any version >*5.1.x* should work)
* Install [electron][]:

[node.js]: https://nodejs.org/
[electron]: https://github.com/atom/electron

```
$ npm install -g electron@latest
```

* Check out this repository

* Install the javascript dependencies by running this command from
within the `itch` directory you've just cloned:

```bash
$ npm install
```

(For native modules, you'll need a compiler toolchain: Visual Studio 2015 on Windows, gcc/clang on Linux/macOS)

* Install grunt's CLI if you don't have it already:

```bash
$ npm install -g grunt-cli
```

* You can now run the app:

```bash
$ npm start
```

This command first compiles newer files from [typescript][] to ES6
understood by both Node.js & Chromium.

We use [grunt][] for building and packaging, see our [CI job definitions][ci].

[typescript]: https://www.typescriptlang.org/
[grunt]: https://github.com/gruntjs/grunt
[ci]: https://github.com/itchio/itch/blob/master/.gitlab-ci.yml

### Running tests

Run:

```bash
$ npm test
```

To run all tests. You can run a single test with:

```bash
$ grunt && node app/tests/runner.js app/tests/localizer-spec.js | tap-spec
```

Or run all the tests in a directory with:

```bash
$ grunt && node app/tests/runner.js app/tests/util | tap-spec
```

[tap-spec]: https://github.com/scottcorgan/tap-spec

### Debug facilities

**:memo: When running from msys, `export OS=cygwin` to see log output**

These keys do things:

  * `Shift-F5` — reload the UI. Since the state is stored outside of the browser,
    this shouldn't corrupt
  * `Shift-F12` — open Chromium developer tools, to inspect the DOM, run arbitrary javascript code, etc.

Some environment variables change the behavior of the application, there's a list in [environment-variables.md](./environment-variables.md)

[diego]: diego.md
