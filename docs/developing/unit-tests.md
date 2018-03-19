
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

Unit tests should run fast, so that they can be run every time a file is saved,
for example.

## Running unit tests

All unit tests are run with vanilla node.js, not electron.

### Running tests once, in a terminal

Run `npm test` to run unit tests once. (or `npm t` for short).

The output is the standard mocha reporter.

## Writing unit tests

The unit tests for `a/module.ts` live in `a/module.spec.ts`.

This allows
one to switch quickly between a file and its test, for example using the
[Toggle Spec plug-in for Visual Studio](https://marketplace.visualstudio.com/items?itemName=simplysh.toggle-spec).

The test harness we use is simply mocha, with chai and chai-as-promised.

### A typical test suite

Let's say we have the following code in `src/util/add.ts`:

```typescript
export default function add(a: number, b: number) {
  return a + b;
}
```

Then in `src/util/add.spec.ts`, we could have the following test:

```typescript
import { describe, it, assert } from "../test";

import add from "./add";

describe("util/add", ()=> {
  // always wrap your tests in one or more cases
  it("adds positive numbers", () => {
    assert.equal(add(1, 3), 4);
  });

  it("adds negative numbers", () => {
    assert.equal(add(-3, 9), 6);
  });
});
```

For more information, visit [chai's assert API documentation](http://www.chaijs.com/api/assert/).

### Asynchronous test cases

Test cases can be asynchronous, like so:

```typescript
describe("request", s => {
  it("can make simple requests", async () => {
    const res = await request("https://itch.io/country", {});
    assert.equal(res.statusCode, 200, "server replies with HTTP 200");
  });
})
```

You can check that an asynchronous function rejects:

```typescript
describe("request", s => {
  it("rejects invalid URLs", async t => {
    await assert.isRejected(request("https://itch.io/country", {}))
  });
})
```
