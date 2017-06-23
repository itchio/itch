
# Unit tests

Unit tests are for checking that a specific, well-isolated bit of code does what
it should. It's especially useful for testing corner cases.

When a test runs some code, we call that code "covered". We're not aiming
for 100% coverage, which is almost always a waste of time. But the essential parts
of the app should be unit tested.

## What unit tests shouldn't do

With few exceptions, unit tests should try not to:

  * Read/write files from disk
  * Make network requests (including DNS)

The database is fair game, since SQLite can operate in-memory.

Unit tests should run fast, so that they can be run every time a file is saved,
for example.

## Running unit tests

All unit tests are run directly within Electron, never vanilla node.js. So they're
run in the same runtime that the app runs in, which gives us access to all the Electron
APIs, for example.

### Tests are run sequentially

Some test runners like AVA fork different node.js processes to run
a bunch of tests in parallel. One nice side-effect is that each test has
its own isolated environment.

However, the app's unit tests are run sequentially, mostly due to the
fact that they run in electron and starting it up takes seconds, not milliseconds.
(Also: I'm pretty sure multiple electron-compiler instances would not agree on the
state of the compile cache, for example).

### Running tests once, in a terminal

Run `npm test` to run unit tests once. (or `npm t` for short).

The output of unit tests is minimal, it should only become noisy when some
tests fail.

> Thanks to [tap-pessimist](https://github.com/clux/tap-pessimist) for the inspiration!

If any tests fail, the process will exit with a non-zero code.

### Running tests on file change (watching)

Run `npm test -- --watch` to re-use the same electron instance to run
tests as soon as a source file is changed.

If you're running Visual Studio code, the `test` task does exactly that, you can:

  * `Ctrl+Shift+P`, type `Run Test Task` then Enter
  * To stop it, 

## Coverage

Running unit tests collects coverage data in the `coverage/` directory.

### Code editor integration

Using an lcov-compatible tool, like the [Coverage Gutters for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters)
allows you to see coverage data directly in your text editor.

> Tip: don't forget to click `Watch Lcov and Editors` in the Visual Studio Code status
> bar, otherwise coverage won't be shown in the gutters.

### Codecov

The Continuous Integration servers also collect coverage data, then upload it
to [our codecov page](https://codecov.io/gh/itchio/itch). It lets us have a nice
badge like that:

  * [![codecov](https://codecov.io/gh/itchio/itch/branch/master/graph/badge.svg)](https://codecov.io/gh/itchio/itch)

Also, if you install the [Codecov browser extension](https://github.com/codecov/browser-extension),
you'll get coverage info overlayed on top of the code 

## Writing unit tests

The unit tests for `a/module.ts` live in `a/module.spec.ts`.

This allows
one to switch quickly between a file and its test, for example using the
[Toggle Spec plug-in for Visual Studio](https://marketplace.visualstudio.com/items?itemName=simplysh.toggle-spec).

The test harness we use is a spruced-up version of [substack/tape][], named
[zopf][]. It's basically the same except it integrates with sinon (for mocks/stubs/etc.)
and groks async tests/cases.

[substack/tape]: https://github.com/substack/tape
[zopf]: https://github.com/itchio/zopf

### A typical test suite

Let's say we have the following code in `src/util/add.ts`:

```typescript
export default function add(a: number, b: number) {
  return a + b;
}
```

Then in `src/util/add.spec.ts`, we could have the following test:

```typescript
import suite from "../test-suite";

import add from "./add";

// always pass __filename to suite. this will name the
// suite "util/add".
suite(__filename, s => {
  // always wrap your tests in one or more cases
  s.case("adds positive numbers", t => {
    t.same(add(1, 3), 4);
  });

  s.case("adds negative numbers", t => {
    t.same(add(-3, 9), 6);
  });
});
```

For the methods of `t`, refer to the typings (`zopf.d.ts`) or to
[tape's README](https://github.com/substack/tape#methods).

### Asynchronous test cases

Test cases can be asynchronous, like so:

```typescript
suite(__filename, s => {
  s.case("we can make simple requests", async t => {
    const res = await request("https://itch.io/country", {});
    t.same(res.statusCode, 200, "server replies with HTTP 200");
  });
})
```

You can check that an asynchronous function rejects:

```typescript
suite(__filename, s => {
  s.case("invalid URLs are rejected", async t => {
    await t.rejects(request("https://itch.io/country", {}))
  });
})
```

### Comparing sets

Sometimes you want to know that two arrays have the same elements, but not
necessarily in the same order:

```typescript
suite(__filename, s => {
  s.case("sameSet works", async t => {
    t.sameSet([1,2,3], [3,1,2])
  });
})
```

### Mocking and spying

The full [sinon](http://sinonjs.org/) API is available for mocks and spies. A sandbox
is created implicitly for each test case, so everything is restored at the end of
the case:

```typescript
var obj = {
  sayHi: () => { return "hi"; }
}

suite(__filename, s => {
  s.case("we can mock sayHi", async t => {
    t.mock(obj, "sayHi").returns("bye");
    t.same(obj.sayHi(), "bye");
  });

  s.case("and now it's not mocked anymore", async t => {
    t.same(obj.sayHi(), "hi");
  });
})
```

### Proxyquire

Documenting this with the caveat that **you probably shouldn't need proxyquire**.

What it lets you do is mess with `require()` so that some modules get something
other than what they expect.

Basically, this code would hit the filesystem:

```typescript
import writeHelloToFile from "./write-hello-to-file";

suite(__filename, s => {
  s.case("writeHelloToFile does its thing", async t => {
    await writeHelloToFile("hello.txt");
  });
})
```

```typescript
import * as proxyquire from "proxyquire";

let pathWritten = "";
const fakeFs = {
  writeFileAsync: async (path: string, contents: string) => {
    pathWritten = path;
  };
}
const writeHelloToFile = proxyquire({
  // this path must exactly match the argument passed to `require()`
  "../fs": {
    // oh yeah proxyquire isn't ES-module-friendly
    __esModule: true,
    default: fakeFs,
  },
  // see https://github.com/thlorenz/proxyquire for options
  "@noCallThru": true,
}).default; // we need to get `.default` explicitly since it's a dumb require

suite(__filename, s => {
  s.case("we can fool writeHelloToFile", async t => {
    await writeHelloToFile("hello.txt");
    t.same(pathWritten, "hello.txt");
  });
})
```

See, it gets messy.

### How to *not* proxyquire

Here are better ideas instead of proxyquiring stuff:

**Isolate functions properly and pass them everything they need to operate**.

That means no globals. And yes, `fs` is a global. For example, `api` can have its
net stack switched from under it - bam, no proxyquire.

**Separate planning and side-effects**.

[This article](http://blog.jessitron.com/2015/06/ultratestable-coding-style.html) says it best.

But basically, and in case it goes down:

  * Let's say you need to generate a directory structure
  * Your code needs to do two things, and when writing it naively, it's easy to mix them:
    * Figure out exactly what file needs to be put where and with what content
    * Write it to disk
  * Instead of mixing both, you can have "figure it out" be one function, that
    returns a data structure that we'll call "the plan". That function is easy to test,
    no need to mock anything!
  * And then, an "apply" function that takes "the plan" and carries out the side-effects.
    You can also test that, you can even make it hit the filesystem if you want, but since
    the structure of the plan is simple, there's fewer cases to tests, it's all beautiful
    and neatly separated.
