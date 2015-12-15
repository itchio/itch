# itch

![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![Build Status](https://ci.itch.ovh/job/itch/badge/icon)](https://ci.itch.ovh/job/itch/)
[![Coverage Status](https://coveralls.io/repos/itchio/itch/badge.svg?service=github)](https://coveralls.io/github/itchio/itch)

The goal of this project is to give you a desktop application that you can
download and run games from [itch.io](http://itch.io) with. Additionally you
should be able to update games and get notified when games are updated. The
goal is not to replace the itch.io website.

## Screenshots

![](https://cloud.githubusercontent.com/assets/7998310/10584017/554ac534-7690-11e5-8c5a-6eda011022e8.png)

## Installing

itch is built in HTML/SCSS/ES6 and runs inside of Electron. Install the
following to get started with development:

<<<<<<< HEAD
* Install [node.js][] (version *4.2.x* is recommended, tests won't run on anything lower)
* Install [electron][]:

[node.js]: https://nodejs.org/
[electron]: https://github.com/atom/electron

```
npm install -g electron-prebuilt@0.35.4
```

**N.B: 0.36.0 is known not to work with itch, 0.35.4 is the recommended release**

* Install [sassc][] following the instructions for [Unix][sassc-unix] or
  [Windows][sassc-win].  Make sure it's in your `$PATH`.

[sassc]: https://github.com/sass/sassc
[sassc-unix]: https://github.com/sass/sassc/blob/master/docs/building/unix-instructions.md
[sassc-win]: https://github.com/sass/sassc/blob/master/docs/building/windows-instructions.md

* Check out this repository

* Install the javascript dependencies:

```bash
$ npm install
```

* You can now run the app:

```bash
$ npm start
```

Running the app like that will be slower than a release, as it compiles
files as they are loaded, with [babel][]'s require hook.

We use [grunt][] for packaging, see our [CI job definitions][ci].

[babel]: http://babeljs.io/
[grunt]: https://github.com/gruntjs/grunt
[ci]: https://github.com/itchio/ci.itch.ovh/blob/master/src/jobs/itch.yml

## itch for game developers

If your game is:

  * an archive (.zip, .7z, .tar.gz, .tar.bz2) — *but not .rar*
    * containing an .exe on Windows
    * containing a .app bundle or shell script on OSX
    * containing an .exe or shell script on Linux
  * an installer powered by NSIS or InnoSetup on Windows
  * an MSI file on Windows
  * just a plain .exe file on Windows (not recommended)

Then you're golden.

Try logging in with your account and installing+launching your game.

If it fails, inspect the log by `Alt-clicking` on the game's thumbnail,
it should open a `.txt` file with your default text editor.

See where game is installed by `Shift-clicking` on it or clicking the
'Open folder' icon.

## Debug facilities

**N.B. when running from msys, `export OS=cygwin` to see log output**

These keys do things:

  * `Shift-F5` — reload the UI. Since the state is stored outside of the browser,
    this shouldn't corrupt 
  * `F12` — open Chrome Devtools

These environment variables will change the behavior of the app:

  * `DEVTOOLS=1` — start with Chrome Devtools open — useful when something goes
    wrong before the `F12` binding becomes available.
  * `MARCO_POLO=1` — dumps all Flux events being dispatched throughout the app.
    We attempt to filter that (see `private` field in payloads) but **please
    pay extra care to any logs you post publicly** to make sure you're not leaking
    your own credentials.
  * `DANGERZONE=1` — enable `Danger Zone` Help submenu with crashing options

Pro-tip: [undock the Chrome devtools][undock], they're more usable as a separate Windows.

[undock]: https://encrypted.google.com/search?hl=en&q=chrome%20dev%20tools%20undock

## License

Licensed under MIT License, see `LICENSE` for details.

## Other apps

Here are some other apps people have started:

* Android: https://github.com/gotosleep/ItchDroid
* iOS: https://github.com/khwang/cantaloupe
