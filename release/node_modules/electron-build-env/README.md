# electron-build-env

An API (and command-line tool) to execute a command inside of Electron projects, configured properly to build native dependencies with the right versions of V8 and Node to work in Electron.

## Installation

```
npm install --save electron-build-env
```
    
## Usage

```js
var build = require('electron-build-env');

build(["npm", "install"], function(err) {
  if (err) {
    console.log('Installation failed.');
  } else {
    console.log('Installation succeeded!'); 
  }       
});
```
    
## API

### build(cmd, opts, done)

Run a command where:

- `cmd` is the command with arguments
- `opts` is an options object (default: `{}`)
  - `opts.electron` is the Electron version (default: local electron's `package.json` `"version"`)
  - `opts.arch` is the target architecture (default: `process.arch`)
  - `opts.disturl` is the URL for downloading Electron headers (default: `"https://atom.io/download/electron"`)
  - `opts.devdir` is the path for the Electron headers directory (default: `"~/.electron-gyp"`)
- `done` is a function called when the command has finished (default: do nothing)
