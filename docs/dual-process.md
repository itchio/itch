
Here's a cool ASCII diagram:

```
                                    ||
                                    ||
         NODE.JS SIDE               ||                CHROMIUM SIDE
  (process.type === 'browser')      ||         (process.type === 'renderer')
         ____________               ||            _______________________
        [            ]              ||           [                       ]
        [ main store ] ----------- diff ------>> [ replica of main store ]
        [____________]              ||           [_______________________]
              ^                     ||                    ^
compose into  |                     ||                    | read from
              |                     ||                    |           
   ___________|______               ||            ________|_________
  [                  ]              ||           [                  ]
  [    aux stores    ] <<-------- actions ------ [ react components ]
  [__________________]              ||           [__________________]
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
