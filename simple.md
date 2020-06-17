
## Goals

Simplify itch's codebase greatly.

## Webpack

Webpack is gone, good riddance. `gobbler/` is a simple codebase that:

  * acts as CLI tool (for production) or a library (for develop.js)
  * detects changed files
  * builds them with babel only, using numcpu workers
  * knows to insert a react-refresh wrapper in development
  * watches `src/` for changes in development, and sends a request
  to itch so it reloads its own code and triggers a react-refresh

## Broth

Broth is dead. butler's codebase still exists, it's now compiled as 
a native node addon (using the stable N-API ABI) with the help of
Rust, see https://github.com/itchio/valet

This means:

  * no need to download butler on first run / check for updates on
  subsequent runs
  * no antivirus freaking out because we "drop executables" on disk
  * no "connection timeout" even though it's a TCP connection

There are no TCP connections left, even local. It's all in-process.
For main-renderer, there's Electron IPC, which has gotten better
as of Electron 9.x - they use structured cloning now.

## Redux

Redux is no longer used. Instead, state is mostly kept in react hooks.

Stuff that really does need to persist is sent to the main process using
a simple query system that uses Electron IPC under the hood.


