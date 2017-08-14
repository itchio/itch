
# Dependencies

itch uses a few external tools to download & manage content.

It installs and keeps them up-to-date automatically, which means you should
never have to worry about them. However, in the interest of you knowing what
runs on your computer, they're documented here.

Everything is downloaded from our download server at `https://dl.itch.ovh`.

Third-party programs like `unarchiver` or `firejail` are built from source.
Home-grown programs are continuously built on our CI servers.

## Directories

All dependencies are downloaded and extracted into the following folders:

  * `%APPDATA%\itch\bin` on Windows
  * `~/Library/Application Support/itch/bin` on OSX
  * `~/.config/itch/bin` on Linux

## Packages

### unarchiver

The Unarchiver is a GUI application for OS/X that can extract a great number
of archive formats. Its underlying compression engine is cross-platform and
comes with command-line utilities.

It is distributed by Dan Ågren under the [LGPL 2.1](https://bitbucket.org/WAHa_06x36/theunarchiver/src/d89b1d069727c3dd68939e29aa407b6f2051ef6b/License.txt?fileviewer=file-view-default)

It's the first thing itch downloads, and the only uncompressed package we
distribute. Subsequent dependencies are distributed in the `.7z` archive
format, which helps us keep downloads fast.

  * e.g. a 15MB butler executable compresses down to a ~3MB .7z archive

The version distributed on `dl.itch.ovh` is built from source and is digitally
signed where applicable (windows, macOS).

### butler

butler is a homemade (itch.io-made) command-line tool, distributed under the MIT license.

Its source code is available here, for you to audit, debug, and improve at will:

  * <https://github.com/itchio/butler>

Building your own version is as simple as running:

```
go get -v github.com/itchio/butler
```

(assuming you have Go 1.7+ installed on your system)

You can drop your custom build of butler in the directories described in the
[Directories](#directories) section of this page — if it reports version `head`,
itch will not attempt to update it.

### activate ![](https://img.shields.io/badge/platform-macOS-708090.svg)

activate is a homemade (itch.io-made) command-line tool. Its purpose is to
interact with macOS in ways that are not possible directly from [Electron](http://electron.atom.io/).

Its source code is available here, for you to audit, debug, and improve at will:

  * <https://github.com/itchio/activate>

### firejail ![](https://img.shields.io/badge/platform-linux-708090.svg)

firejail is a sandbox for Linux that have very few dependencies (except a 3.x
kernel). It is used by the itch app to run games sandboxed, see [Linux sandboxing](/using/sandbox/linux.md)

The version distributed on `dl.itch.ovh` is built [from source](https://github.com/netblue30/firejail),
on [our CI server](https://git.itch.ovh/itchio/firejail-buildscripts)

## Implementation

The logic for downloading, extracting and installing itch dependencies
can be found in [ibrew.js][] and required files.

[ibrew.js]: https://github.com/itchio/itch/blob/master/src/util/ibrew.js

The authors are aware of the irony of having an ad-hoc, half-baked Implementation
of a package manager inside a package managing application, itself installed by
various other package managers, and there is no need to point it out!
