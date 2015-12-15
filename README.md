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

* Install [Node.js](https://nodejs.org/). Tests aren't working with 0.12.* versions.
* Install [Electron](https://github.com/atom/electron):

```
npm install -g electron-prebuilt@0.35.4
```

**N.B: 0.36.0 is known not to work with itch, 0.35.4 is the recommended release**

* Install [sassc](https://github.com/sass/sassc) following the instructions for [Unix](https://github.com/sass/sassc/blob/master/docs/building/unix-instructions.md) or [Windows](https://github.com/sass/sassc/blob/master/docs/building/windows-instructions.md). Make sure it's in your `$PATH`.

Check out this repository

Install the javascript dependencies:

```bash
$ npm install
```

You can now run the app:

```bash
$ npm start
```

## License

Licensed under MIT License, see `LICENSE` for details.

## Other apps

Here are some other apps people have started:

* Android: https://github.com/gotosleep/ItchDroid
* iOS: https://github.com/khwang/cantaloupe
