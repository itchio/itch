
## Tree structure

Electron apps have two sides: what happens in the browser/node.js process,
and what happens in the renderer/chromium process.

In itch, things that happen on the browser/node side are:

  * API requests
  * Getting dependencies with ibrew
  * Driving downloads with butler
  * Launching applications
  * Displaying native dialog boxes

Things that happen on the renderer/chromium-content side:

  * Rendering the whole UI
  * Showing HTML5 notifications

**Never use RPC** — it's a nice idea, but synchronous message passing blocks
the renderer process completely.

These used to be separated in the source tree, but they no longer are,
because it's useful to share code between them sometimes (with two copies,
one on each side).

Most stores live on the browser/node side, except **AppStore**, which gathers
all data for the react app, and **I18nStore** which simultaneously lives on
both sides to avoid RPC.

## Building

Sources are in `appsrc` and `testsrc`, compiled javascript files are
in `app`, and `test`.

Grunt drives the build process:

  * the `copy` task copies some files as-is (example: `testsrc/runner`)
  * the `sass` task compiles SCSS into CSS
  * the `babel` task compiles ES6 into... ES6 that Chrome & node.js understand

There's `newer` variants of these tasks (`newer:sass`, `newer:babel`) which
only recompile required files — those are the default grunt task.

The recommended workflow is simply to edit files in `appsrc` and `testsrc`,
and start the app with `npm start`. It calls the grunt `newer` tasks, and
starts electron for you.

## ES6 features we use / babel plug-ins

Although the codebase is compiled with babel, we try to keep the number of plug-ins
at a minimum. The first transform is to enable strict mode on all files, which
allows us to take advantage of the following:

  * ES6 classes (with inheritance, super)
  * let, const
  * fat arrow functions

We use `transform-function-bind` to let us write code like this:

```javascript
// underline is a function-bind-friendly version of underscore
import {isEqual} from 'underline'

obj::isEqual({a: 'b'})
```

We use `transform-es2015-modules-commonjs` to be able to write:

```javascript
// with babel
import whole_module from './path/to/module'
import {a, few, funcs} from 'collection-module'

export default SomeClass
```

instead of:

```javascript
// without babel
const whole_module = require('./path/to/module')
const {a, few, funcs} = require('collection-module')

module.exports = SomeClass
```

The syntactic gain isn't obvious, but it helps some static analysis tools (linters,
autocompletion, etc.) pick up on the import graph between modules.

We use `transform-es2015-destructuring` to be able to write this:

```javascript
// with babel
const {a, b, c = 42} = obj

// without babel
const a = obj.a
const b = obj.b
const c = obj.c || 42 // not an exact equivalent..

// same goes with arrays
const [a, b, c] = arr
```

We use `transform-async-to-module-method` to be able to write code using
`async/await` that translates to Bluebird coroutines.

Conceptually, it lets us write this:

```javascript
function install_software (name) {
  return download(name)
  .then(() => extract(name))
  .then(() => verify(name))
  .catch((err) => {
    // Uh oh, something happened
  })
}
```

...but like this:

```javascript
async function install_software (name) {
  try {
    await download(name)  
    await extract(name)  
    await verify(name)  
  } catch (err) {
    // Uh oh, something happened
  }
}
```

We use the `contracts` plugin to be able to write assumptions like this:

```javascript
async function process_game_transaction (game_id) {
  pre: { // eslint-disable-line
    typeof game_id === 'number'
    game_id > 0
  }

  invariant: { // eslint-disable-line
    account.balance >= 0
  }

  // buy game logic

  post: { // eslint-disable-line
    transaction.done === true
  }
}
```

They're stripped in production, so there's no performance penalty. The
`// eslint-disable-line` part is because the contracts plug-in is abusing
(re-using) the label syntax, and eslint isn't really happy about that by default.

Speaking of eslint, it's used by `standard`, the code standard we follow throughout
the codebase. The `eslint-babel` parser is used to account for all the extras
listed above.

## Testing

`npm test` is a bit slow, because it uses `nyc` to register code coverage.

`test/runner` is a faster alternative. (If the `test` directory doesn't exist,
just run `grunt copy`). See `docs/developing.md` for more details.

The test harness we use is a spruced-up version of `substack/tape`, named
zopf. It's basically the same except you can define cases, like so:


```javascript
import test from 'zopf'

test('light tests', t => {
  t.case('in the dark', t => {
    // ... test things
  })
  t.case('in broad daylight', t => {
    // ... test things
  })
  t.case('whilst holding your hand', t => {
    // ... test things
  })
})
```

Cases run in-order and produce pretty output with `tap-difflet`, like this:

![](test-output.png)

Also, cases can be asynchronous

Two other tools we use heavily in tests are `proxyquire`, to provide fake
versions of modules, and `sinon`, to create spies/stubs/mocks. They're both
pretty solid libraries, and together with tape

## Casing

`camelCase` is used by most of the JavaScript ecosystem (core nodejs
packages, react, etc.), we have no choice but to use that when
implementing React components for example.

For everything `snake_case` is the preferred style at itch corp. Since
eventually we'll share code between the client and the main site, it
makes sense to keep using `snake_case` everywhere.

> That means the same component can have a `componentDidMount` method
> (implementing a React callback) and a `render_uploads` method
> (internal method).

## CSS

Class names are `snake_case`, not `kebab-case`. There's a `style/main.scss`
which imports everything else that's needed.

Most `@mixin`s go in `style/main/_common.scss`. We have mixins for stuff like
`transition`, `gradients`, probably not all that relevant in an Electron
environment but, again, shared code with main itch.io codebase = easier
time for everyone.

## React components

Exports from a `components/**/*.js` file should be a single ES6 class that
extends `react.Component` one way or the other.

```javascript
// in components/foo-bar.js
import r from 'r-dom'
import ShallowComponent from './shallow-component'

class InternalThing extends ShallowComponent {
  render () {
    const {message} = this.props
    return r(div, {}, message)
  }
}

class FooBar extends ShallowComponent {
  render () {
    return r(InternalThing, {message: 'Secrets!'})
  }
}

export default FooBar
```

The codebase provides the base classes `DeepComponent` and `ShallowComponent`,
both of which inherit from `TranslatedComponent`, making `this.t` available
for getting translated strings.
