
## Installing

itch is built in HTML/SCSS/ES6 and runs inside of Electron. Install the
following to get started with development:

* Install [node.js][] (any version >*5.1.x* should work)
* Install [electron][]:

[node.js]: https://nodejs.org/
[electron]: https://github.com/atom/electron

```
$ npm install -g electron-prebuilt@0.37.2
```

* Check out this repository

* Install the javascript dependencies by running this command from
within the `itch` directory you've just cloned:

```bash
$ npm install
```

* Install grunt's CLI if you don't have it already:

```bash
$ npm install -g grunt-cli
```

* You can now run the app:

```bash
$ npm start
```

This command first compiles newer files from ES2016 to a subset of ES6
understood by both Node.js & Chromium, in strict mode.

We use [grunt][] for building and packaging, see our [CI job definitions][ci].

[babel]: http://babeljs.io/
[grunt]: https://github.com/gruntjs/grunt
[ci]: https://github.com/itchio/ci.itch.ovh/blob/master/src/jobs/itch.yml

### Running tests

Run:

```bash
$ npm test
```

To run all tests. You can run a single test with:

```bash
$ test/runner test/util/os-spec.js
```

Or run all the tests in a directory with:

```bash
$ test/runner test/components
```

[tap-spec]: https://github.com/scottcorgan/tap-spec

`test/runner` is a bash script, so if you're on Win32 running on PowerShell or cmd.exe,
you might want to use this variant:

```PowerShell
$ grunt; node test/runner.js test/components
```

Note that this will run tests even if `grunt` invocation fails. If someone
knows a good replacement for `&&` in PowerShell, please open an issue.

### Debug facilities

**:memo: When running from msys, `export OS=cygwin` to see log output**

These keys do things:

  * `Shift-F5` — reload the UI. Since the state is stored outside of the browser,
    this shouldn't corrupt
  * `Shift-F12` — open Chromium developer tools, to inspect the DOM, run arbitrary javascript code, etc.

Some environment variables change the behavior of the application, there's a list in [environment-variables.md](./environment-variables.md)

[diego]: diego.md
