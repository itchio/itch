
# Integration tests

Whereas unit tests are small, fast, and test code directly (trying not to hit
slow things like the filesystem, the network, etc.), **integration tests** are
the opposite.

They make sure that all of the code, together, makes meaningful interactions happen.

> Speaking of: if you haven't read the [Unit tests](unit-tests.md) section already,
> go do that first.

The app is tested as a whole using [spectron](https://www.npmjs.com/package/spectron),
it goes something like:

  * spectron starts the app with special command-line flags
  * the app starts listening on a port for TCP connections
  * spectron connects and lets the test know it's ready for some commands
  * each command is sent asynchronously over the TCP connection
  * ..and so are the results
  * spectron decodes the results and resolves the command's promise to it.

### Harsh reality check

In theory, **everything is awesome** because this lets us mess with the app
in an automated way, instead of having to do extensive manual QA (which
often ends up being ignored because "how could that break, I didn't come NEAR this
part of the codebase" and "we really need to get this release out now").

In practice however, integration testing is slow. It's not something you run
every time a file is saved (as opposed to unit tests).

Spinning up the whole app for integration testing takes a few seconds
(it's slower than usual because of the extra machinery involved).

You also need some sort of UI server to be running (Xorg, whatever macOS does, whatever
Windows does) - headless chrome is coming at some point, but electron's current
(1.7.3) chromium versoin does not have it. So it paints stuff, and that slows it down.

Sometimes you'll be trying to click an element but the app was too slow and the
element doesn't exist yet. Or a CSS animation will be running, and the element
won't be "clickable" yet (because it's transparent, or something else is in front of it,
or it's outside the viewport, or...)

> In integration tests, CSS animations are disabled for this very reason. As an added
> bonus, it also makes the tests faster!

So while ideally we'd run **each integration test in its own app instance**, in practice
they're arranged in a series that are run in the same instance, so that we only pay
for the start-up cost once. That may change in the future. Don't trust docs.

### Running integration tests

It looks deceptively simple:

```bash
yarn run integration-tests
```

But it'll error out pretty soon if you don't have the right environment variables set.

If you're an itch.io employee, poke Amos about it to get set up. If you're not, well
consider this page "light reading" - open-source contributors are expected to run
(and write!) unit tests, not integration tests. We'll take care of that part!

### Writing an integration test

Scenarios live in `src/integration-tests`, along with some support code that makes
it all tick. They're also explicitly listed in `src/integration-tests/tests.ts`.

They look like unit tests somewhat, in fact they have the whole power of zopf available
(but you won't be doing a lot of mocking or spying, ha).

Here's what a simplified login flow test would look like:

```typescript
import { IIntegrationTest } from "./types";

export default async function loginFlow(t: IIntegrationTest) {
  // this is the spectron client, that communicates
  // with the app (the server, in this set-up)
  const { client } = t.app;

  // since integration tests are fiddly and can blow up anytime
  // (and spectron errors aren't the best in the world), it's a good
  // idea to narrate what you're trying to do here.
  t.comment("logging in with dumb credentials");

  // the test starts when the DOM has fully-loaded. for the app that
  // means the login screen.
  // all methods of client are async, so we need to await them
  await client.setValue(
    /** any CSS selector will work */
    "#login-username",
    /**
     * setValue clears an input and sends a sequence of key presses.
     *
     * You can press Enter, Backspace, and so on: see 
     * https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions
     * for a full list of special characters.
     */
    "joe",
  );
  await client.setValue("password", "hunter2");

  // this is one of the app's extension to spectron:
  // first it waits for the element to exist,
  // then
  await t.safeClick("#login-button");

  // this handy spectron method waits until a given element
  // contains some text. as far as I can tell, it doesn't
  // work if one of the *children* contains that text, it has
  // to be the direct element. I might be wrong.
  await client.waitUntilTextExists(
    "#login-errors",
    // the actual text is "Incorrect username or password", but
    // partial matches will work.
    "Incorrect username",
  )

  // ^ if the element doesn't exist, or the text still doesn't match
  // after some time, this will throw and the integration test runner
  // will stop.
}
```

### Taming a failing test

When an integration test fails on the CI, it takes a screenshot, and it's
collected as part of the build artifacts.

On GitLab CI, from the job page, click "Browse" under Artifacts, navigate to
`screenshots/`, and voilà! It even shows them inline now!

Occasionally test will fail through not fault of yours. Spectron (and all its deps)
are fiddly like that. If it happens in CI, you can just retry the job. (But make
sure to check the screenshots first, to see if it's not a genuine error condition or
something we can avoid easily).

If you're running tests locally and you can reliably reproduce an error, feel free
to pepper a few more `t.comment` to pinpoint exactly where it fails. Good ol' printf
debugging.

