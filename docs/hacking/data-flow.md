
Electron apps are a bit peculiar, because they have two types of processes:

  * A single node.js process, that lives throughout the application's runtime
  * Renderer processes, one per browser window (or web contents, really)

Thanks to Electron's `node-integration`, both of these can `require()` the same
modules — but they're different copies, being executed by different JavaScript
runtimes, completely isolated, so if you have a module like this:

```JavaScript
module.exports = { prop: 'initial' }
```

And then do this in the renderer process:

```JavaScript
require('./my-module').prop = 'renderer!'
```

Then the following will still be true in the browser process:

```JavaScript
require('')
```

```
                                    ||
                                    ||
         NODE.JS SIDE               ||                CHROMIUM SIDE
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
  [    sagas + reducers    ] <<-- actions ------ [ react components ]
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
