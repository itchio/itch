
# Diving into performance

## Environment variables

Each of these environment variables will slow down the app, but also provide insights as to how
to make it faster (mostly, make it do less work):

  * `ITCH_REACT_PERF=1` will append `?react_perf` to the loaded URL, which lets you do

```javascript
var Perf = require("react-addons-perf");
Perf.start();
// do stuff
Perf.stop();
Perf.printWasted(); // or whatever else
```

  * `ITCH_RESELECT_EVERYTHING=1` will make all connected components evaluate `mapStateToProps`
  twice with exactly the same inputs, and if they return objects that aren't ===, it prints an error
  to the console. This helps spotting connected components that aren't using memoized selectors (reselect) yet.

  * `ITCH_WHY_UPDATE=1` will enable [why-did-you-update](https://github.com/garbles/why-did-you-update). It's
  quite verbose.

  * `ITCH_DONT_SHOW_WEBVIEWS=1` will avoid creating any `<webview/>` elements, which lets you measure more
  accurately how much RAM the app is using.

## Production vs Development environments

When measuring some things, you may want to set `NODE_ENV=production`. Things that slow down the development
environment include:

  * React prop validations
  * Bluebird longStackTraces
  * Source map support (with require hook)
  * Hot Module Reloading (?)

Note: `react-addons-perf` only works in the development environment.
