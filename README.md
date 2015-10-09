# itch.io app

[![Build Status](https://travis-ci.org/itchio/itchio-app.svg)](https://travis-ci.org/itchio/itchio-app)
[![Build status](https://ci.appveyor.com/api/projects/status/g55d4rq4jc1tdh05?svg=true)](https://ci.appveyor.com/project/fasterthanlime/itchio-app)
[![Coverage Status](https://coveralls.io/repos/itchio/itchio-app/badge.svg?branch=tasks&service=github)](https://coveralls.io/github/itchio/itchio-app?branch=tasks)
[![Dependency Status](https://david-dm.org/itchio/itchio-app.svg)](https://david-dm.org/itchio/itchio-app)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

**This project is in early development!**

The goal of this project is to give you a desktop application that you can
download and run games from [itch.io](http://itch.io) with. Additionally you
should be able to update games and get notified when games are updated. The
goal is not to replace the itch.io website.

## Installing

The itch.io app is built in HTML/SCSS/ES6 and runs inside of Electron.
Install the following to get started with development:

* Install [Node.js](https://nodejs.org/)
* Install [Electron](https://github.com/atom/electron), and [gulp](http://gittup.org/tup/):

```
npm install -g electron-prebuilt grunt-cli
```

Check out this repository

Run the following commands:

```bash
$ npm install
$ grunt
```

You can now run the app:

```bash
$ electron .
```

## Screenshots

![](https://misc.amos.me/shots/Screen%20Shot%202015-10-04%20at%2019.09.56.png)


## License

Licensed under MIT License, see `LICENSE` for details.

## Other apps

Here are some other apps people have started:

* Android: https://github.com/gotosleep/ItchDroid
* iOS: https://github.com/khwang/cantaloupe
