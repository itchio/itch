
# Integration tests

Whereas unit tests are small, fast, and test code directly (trying not to hit
slow things like the filesystem, the network, etc.), **integration tests** are
the opposite.

They make sure that all of the code, together, makes meaningful interactions happen.

> Speaking of: if you haven't read the [Unit tests](unit-tests.md) section already,
> go do that first.

The app is tested as a whole using a homegrown golang runner that speaks webdrive
to the app. It goes something like:

  * the runner starts the app with special command-line flags
  * the app starts listening on a port for TCP connections
  * the runner connects and lets the test know it's ready for some commands
  * each command is sent asynchronously over the TCP connection
  * ..and so are the results
  * the runner decodes the results and resolves the command's promise to it.

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
npm run integration-tests
```

But it'll error out pretty soon if you don't have the right environment variables set.

If you're an itch.io employee, poke Amos about it to get set up. If you're not, well
consider this page "light reading" - open-source contributors are expected to run
(and write!) unit tests, not integration tests. We'll take care of that part!

### Writing an integration test

Scenarios live in `integration-tests`, along with some support code that makes
it all tick. They're also explicitly listed in `integration-tests/main.go`.

These resources can be useful:

  * The [webdriver API docs](http://webdriver.io/api.html)
  * Existing tests!
