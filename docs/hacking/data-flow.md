
itch follows the [Redux][] design pattern — to understand the rest of this page,
you need to be familiar with it. The basics are as follows:

  * All state is stored in a single place (the store)
  * All change happens via actions, that are dispatched by the store, to:
    * Reducers, which compute new state from the old state and the action
    * Reactors which are used in itch to apply side-effects
  * The UI is rendered directly from the state

[Redux]: http://redux.js.org/index.html

## Separate processes

Electron apps are a bit peculiar, because they have two types of processes:

  * A single node.js process, that lives throughout the application's runtime
  * Renderer processes, one per browser window (or web contents, really)

Thanks to Electron's `node-integration`, both of these can `require()` the same
modules — but they're different copies, being executed by different JavaScript
runtimes, completely isolated, so if you have a module like this:

```JavaScript
// my-module.js
module.exports = { prop: 'initial' }
```

And then do this in the renderer process:

```JavaScript
// this only affects the renderer's copy of `./my-module`
require('./my-module').prop = 'renderer!'
```

Then the following will still be true in the browser process:

```JavaScript
// the browser process is reading from its own copy of the module,
// which still has the initial value
require('./my-module').prop === 'initial'
```

## RPC

One way to communicate between the browser process and renderer processes
is Electron's `remote` module, which gives you a reference to the remote version
of a module. To continue on our example above:

```JavaScript
// in the renderer
var remote = require('electron').remote
remote.require('./my-module').prop = 'renderer'
```

RPC (Remote Procedure Call) is implemented under-the-hood with a special kind
of JavaScript objects, which react to 'reading/writing properties' and calling
methods by sending a synchronous IPC (Inter-Process Communication) call to the
other process, and then waiting for the response.

This is fine for one-off calls on occasion, but isn't suitable for continuous
data transfer throughout the application's lifecycle, as blocking both processes
on every call is a serious performance penalty.

*It gets worse: imagine traversing a large object hierarchy — every field access
results in a blocking IPC call.* One can mitigate this by serializing the object
hierarchy to JSON and sending that over, in a single call. Depending on the size
of the object to be sent, though (all the application state, for example), it might

## Data architecture



```
                                    ||
                                    ||
         NODE.JS SIDE               ||                CHROMIUM SIDE
         aka 'metal'                ||                aka 'chrome'
  (process.type === 'browser')      ||         (process.type === 'renderer')
       _______________              ||            ___________________
      [               ]             ||           [                   ]
      [ browser store ] ---------- diff ------>> [ renderer store(s) ]
      [_______________]             ||           [___________________]
              ^                     ||                    ^
compose into  |                     ||                    | read from
              |                     ||                    |           
   ___________|____________         ||            ________|_________
  [                        ]        ||           [                  ]
  [  reactors + reducers   ] <<-- actions ------ [ react components ]
  [________________________]        ||           [__________________]
              |                     ||                    |
interact with |                     ||                    | render to
              v                     ||                    v
            [ OS ]                  ||                 [ DOM ]
                                    ||               
     (stuff like windowing,         ||           (which we can only touch
     file system, etc., things      ||           from this process)
     HTML5 sandboxes us out of      ||
     and that still need to run     ||
     even when the chromium window  ||
     is entirey closed)             ||
                                    ||
                                    || <- process barrier, only
                                    ||    things that cross it are JSON
                                    ||    payloads sent asynchronously via IPC
```
