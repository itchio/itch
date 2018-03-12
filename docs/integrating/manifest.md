
# App manifests

There are several good reasons to include an app manifest with your game:

  * The [built-in heuristics](./README.md) do not accurately identify the "main executable" to launch
  * The user should be able to choose between several executables
    * Examples: game, level editor, etc.
  * The user should be able to pick non-executable launch options
    * Examples: pdf/html user manual
  * Your app needs access to the itch.io API, for authentication or more

## Basics

An itch.io app manifest is a file named `.itch.toml` placed at the top-level
of your game directory. For example, the Windows build of a Unity game might
be structured like this:

```
- FooBar-windows.zip
  - FooBar.exe
  - FooBar_Data
  - .itch.toml
```

The same application for macOS could have this structure:

```
- FooBar-macOS.zip
  - FooBar.app
  - .itch.toml
```

The contents of the file must be valid [TOML markup][toml]. TOML is
relatively young (younger than YAML and JSON), but it simple and friendly
both to humans and computers alike.

[toml]: https://github.com/toml-lang/toml

## Prerequisites (Windows)

itch can ensure a certain number of prerequisites / redistributables are installed before
your app is launched.

Read the [prerequisites documentation](./prereqs/README.md) to get started.

## Actions

A valid manifest should contain one or more actions:

```toml
[[actions]]
name = "play"
path = "FooBar.exe"

[[actions]]
name = "editor"
path = "FooBar.exe"
args = ["--editor"]
```

Valid actions contain at least:

  * A name: this will affect the label shown to users
  * A path: this specifies what to run when the action is picked

For executables, give the path of the `.exe` on Windows, of the binary
or launcher script on Linux, and of the `FooBar.app` app bundle on macOS.

### Names

A few well-known names are supported:

  * `play`: shows up as `Play Now` in english, is highlighted
  * `editor`: shows up as `Editor` in english
  * `manual`: shows up as `User Manual` in english
  * `forums`: shows up as `Forums` in english

Well-known names are localized as well as the rest of the itch app
via our translation platform, and have a corresponding icon.

Custom names are supported too, but you'll need to provide your own
localizations. For example:

```toml
[[actions]]
name = "Let's go already!"
path = "FooBar.exe"

[[actions.locales.fr]]
name = "Allons-y!"

[[actions.locales.de]]
name = "Gehen wir bereits!"
```

*Note: the example manifest above describes just a single action, in three languages.*

### Paths

Paths can either be:

  * A file path, relative to the manifest's location (ie. the game folder)
  * An URL

File paths that are executables will be launched by itch as usual.

File paths that are not executables will be opened by the operating system
shell, for example:

  * A folder might be opened in a file explorer
  * A pdf file might be opened by the system's PDF reader
  * and so on

URLs will be opened as a new tab in the itch app.

### Arguments

The `args` field can be used to specify arguments to pass to executables.

It must be a TOML array:

```
[[actions]]
name = "A lot of arguments"
path = "sample.exe"
args = ["--that", "--is", "--a", "lot=of-arguments"]
```

### Sandbox opt-in

Adding `sandbox = true` to an action opts into [the itch.io sandbox][sandbox]. This
means that, no matter what the user's settings are, the game will always
be launched within the sandbox.

Game developers are encouraged to opt into the sandbox as early as they can
afford to, to have plenty of time to adapt to it. In the future, the sandbox
might become mandatory (for app users).

More information about the itch.io sandbox is available [on its documentation page][sandbox].

[sandbox]: ../using/sandbox.md

### API key & scoping

Games can ask for an itch.io API key by setting the `scope` parameter.

Valid values are:

  * `profile:me`: grants access to `https://itch.io/api/1/jwt/me`
  * (This is the only valid scope for now)

When the `scope` parameter is set, the itch app will generate a game-specific,
session-specific API key, and pass it to the application via the `ITCHIO_API_KEY`
environment variable.

Additionally, the `ITCHIO_API_KEY_EXPIRES_AT` environment variable will be set to the
expiration date of the key, in iso-8601 format.

#### Making requests with the API key

The itch.io API key provided to the game should be the value of an HTTP
header named `Authorization`.

For example, using the JavaScript library `needle`, one would do:

```javascript
const apiKey = process.env.ITCHIO_API_KEY

const opts = {
  headers: { 'Authorization': apiKey }
}
needle.get('https://itch.io/api/1/jwt/me', opts, function (error, response) {
  // deal with error, if any & process response
})
```

#### Accessing the API key in HTML5 games

The HTML5 environment doesn't grant access to environment variables by design,
so the itch app injects a global object named `Itch` into the JavaScript runtime.

Here's the proper way to check that it's there:

```javascript
if (typeof Itch === 'undefined') {
  // not launched by itch app (regular web browser, missing manifest, etc.)
} else {
  // launched by itch app
  makeRequestWithKey(Itch.env.ITCHIO_API_KEY)
}
```

XHR (XMLHTTPRequest / AJAX) requests are normally limited to the host that
served the javascript: in the case of HTML5 games, an HTTP server is spinned
up every time the game is launched. The itch app disables the same-origin
policy so that your HTML5 game can make requests to the itch.io server or
to your own server somewhere else.

### Console / text-mode applications

By default, the itch app redirects the standard output and standard error to
a log file on disk, which helps debugging when reports are sent.

For console applications, this might not be desirable. You can opt out from
redirection by setting the `console` attribute of the relevant action to `true`:

```
[[actions]]
name = "play"
path = "TheWillowEffect.exe"
console = true
```

On Windows, it'll also open a new command line window to display the game into.

On other platforms, this attribute is not yet supported.
