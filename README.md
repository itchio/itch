# itch

![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)
![Built with love](https://img.shields.io/badge/built%20with-%E2%9D%A4-FF8080.svg)
[![Build Status](https://git.itch.ovh/itchio/itch/badges/master/build.svg)](https://git.itch.ovh/itchio/itch/builds)
[![codecov](https://codecov.io/gh/itchio/itch/branch/master/graph/badge.svg)](https://codecov.io/gh/itchio/itch)
[![Translation status](https://weblate.itch.ovh/widgets/itchio/-/itch/svg-badge.svg)](https://weblate.itch.ovh/engage/itchio/?utm_source=widget)

The goal of this project is to give you a desktop application that you can
download and run games from [itch.io](http://itch.io) with. Additionally you
should be able to update games and get notified when games are updated. The
goal is not to replace the itch.io website.

## Screenshots

![](https://cloud.githubusercontent.com/assets/7998310/16583085/7702c448-42b3-11e6-949a-c5b45e906807.png)

![](https://cloud.githubusercontent.com/assets/7998310/16583086/770c632c-42b3-11e6-80e3-6173b2151cfe.png)

![](https://cloud.githubusercontent.com/assets/7998310/16583088/771717ea-42b3-11e6-8081-6192b329d21c.png)

## Downloads

You can download it from <https://itch.io/app>, see [Installing the app](https://itch.io/docs/itch/installing/) for
detailed instructions.

If you'd like to develop the app instead, read the [Getting Started][developing] page of the developer guide.

[developing]: https://itch.io/docs/itch/developing/getting-started.html

## About itch-setup

[itch-setup](https://github.com/itchio/itch-setup) is the installer program for the itch app.

It's a Go executable that runs on Windows, macOS and Linux, and downloads the latest
version of the app directly from <https://itch.io>.

Although itch-setup is normally served from <https://itch.io/app>, the canonical
source to download it (e.g. for packaging purposes), is the following download server:

  * <https://broth.itch.ovh/>

broth is maintained by itch.io employees, and serves various packages related to the
itch app.

## License

itch is released under the MIT License, see the [LICENSE][] file for details.

[LICENSE]: LICENSE

## Other relevant projects

Here are some other apps people have started:

### Android
* [Mitch](https://sr.ht/~gardenapple/mitch)

### iOS
* [Cantaloupe](https://github.com/khwang/cantaloupe)
