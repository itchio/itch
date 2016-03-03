
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

In development, we are using babel's register hook, which means it's
slower, but you don't need to worry about forgetting to recompile.

For SCSS, we use the sassc compiler: https://github.com/sass/sassc

In production, it's driven by `release/prepare.js` and a few `grunt`
tasks.

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
both of which inherit from `TranslatedComponent`, making `this.t` available.
