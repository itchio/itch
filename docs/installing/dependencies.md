
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

### butler

butler is a homemade (itch.io-made) command-line tool, distributed under the MIT license.

Its source code is available here, for you to audit, debug, and improve at will:

  * <https://github.com/itchio/butler>

Building your own version is as simple as running:

```
go get -v github.com/itchio/butler
```

(assuming you have Go 1.9+ installed on your system)

## Implementation

The logic for downloading, extracting and installing itch dependencies
can be found in the `broth` directory.

The authors are aware of the irony of having an ad-hoc, half-baked Implementation
of a package manager inside a package managing application, itself installed by
various other package managers, and there is no need to point it out!
