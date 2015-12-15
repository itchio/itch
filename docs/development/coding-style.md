
## Tree structure

Electron apps have two sides: what happens in the main/node.js process,
and what happens in the browser/chromium-content process.

The node.js side is stored in `metal` (as in, closer to the metal),
whereas the browser side is stored in `chrome` (as in, decorative
chrome plating).

Using Electron's RPC facilities, one can be required from the other
using `require("remote").require("some/module/on/the/other/side")`.

> <https://github.com/atom/electron/blob/master/docs/api/remote.md>

The node.js side is a bunch of CoffeeScript files compiled in-place
to .js files that are then imported as needed by the node.js runtime
whenever they're require()'d.

The browser side is a bunch of CoffeeScript files that are all brought
together in a bundle (`chrome/bundle.js`) via browserify - this allows
us to use `require()` in client-side (ie. browser-side) code and 
potentially share runtime-agnostic code between the node-side and the
browser-side.

> <http://browserify.org/>

## Building

The whole build process is driven by `gulp`:

  * `gulp all` will build everything, whereas `gulp chrome`, `gulp metal`, `gulp scss` will only build the parts you want
  * `gulp watch` will watch for file changes and rebuild only when needed. watchify is especially clever about only rebuilding the parts of `chrome` that are needed.

## Casing

`camelCase` is used by most of the JavaScript ecosystem (core nodejs
packages, react, etc.), we have no choice but to use that when
implementing React components for example.

For everything `snake_case` is the preferred style at itch corp. Since
eventually we'll share code between the client and the main site, it
makes sense to keep using `snake_case` everywhere.

> That means the same component can have a `getInitialState` method
> (implementing a React callback) and a `render_uploads` method
> (internal method).

React components' `displayName`s are `CamelCase`

## CSS

Class names are `snake_case`, not `kebab-case`. There's a `style/main.scss`
which imports everything else that's needed.

Most `@mixin`s go in `style/main/common.scss`. We have mixins for stuff like
`transition`, `gradients`, probably not all that relevant in an Electron
environment but, again, shared code with main itch.io codebase = easier
time for everyone.

## React components

Exports from a `components/**/*.coffee` file should be a single React
factory (created via the `component` helper). If you have private
stuff, declare it locally like so:

```coffee
# in components/foo_bar.coffee
{ div } = React.DOM
component = require "./component"

InternalThing = component {
  displayName: "InternalThing"

  render: ->
    (div {}, @props.message)
}

module.exports = component {
  displayName: "FooBar"

  render: ->
    (InternalThing {message: "Secrets!"})
}
```

`displayName` are very handy with the React devTools, which unfortunately
don't seem to work with Electron at the moment?

> <https://github.com/atom/electron/issues/915>

