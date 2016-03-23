
# Dependencies

itch uses a few external tools to download & manage content.

It installs and keeps them up-to-date automatically, which means you should
never have to worry about them. However, in the interest of you knowing what
runs on your computer, they're documented here.

Everything is downloaded from our download server at `https://dl.itch.ovh`.

Third-party software like `7za` or `file` have been built from sources or mirrored
from software repositories we trust.

## Directories

All dependencies are downloaded and extracted into the following folders:

  * `C:\Users\FOOBAR\AppData\Roaming\itch\bin` on Windows
  * `~/Library/Application Support/itch/bin` on OSX
  * `~/.config/itch/bin` on Linux

## Packages

### 7-zip

7-zip is a general-purpose compressor / decompressor toolkit distributed under
the GNU LPGL: <http://www.7-zip.org/license.txt>

*The unrar restriction is the reason itch doesn't support the RAR format.*

It's the first thing itch downloads, and the only uncompressed package we
distribute. Subsequent dependencies are distributed in the `.7z` archive
format, which helps us keep downloads fast.

  * e.g. a 15MB butler executable compresses down to a ~3MB .7z archive

### butler

butler is a homemade (itch.io-made) command-line tool, distributed under the MIT license.

Its source code is available here, for you to audit, debug, and improve at will:

  * <https://github.com/itchio/butler>

Building your own version is as simple as running:

```
go get -v github.com/itchio/butler
```

(assuming you have Go 1.6+ installed on your system)

You can drop your custom build of butler in the directories described in the
[Directories](#directories) section of this page — if it reports version `head`,
itch will not attempt to update it.

### elevate

elevate is a homemade (itch.io-made) command-line tool. Its purpose is to allow
launching external processes (such as game installers) with elevated privileges,
by asking the user permission with an [UAC prompt][].

[UAC prompt]: https://en.wikipedia.org/wiki/User_Account_Control

### file

file(1) is a well-known unix command-line utility that exposes complex file sniffing
logic, and lets itch detect certain kinds of archives-packed-as-executables.

It is only installed if itch encounters a file that it doesn't know how to handle
using more conventional means.

The version distributed on `dl.itch.ovh` is taken from the [MSYS2][] repositories.

[MSYS2]: http://msys2.github.io/

## Implementation

The logic for downloading, extracting and installing itch dependencies
can be found in [ibrew.js][] and required files.

[ibrew.js]: https://github.com/itchio/itch/blob/master/appsrc/util/ibrew.js

The authors are aware of the irony of having an ad-hoc, half-baked Implementation
of a package manager inside a package managing application, itself installed by
various other package managers, and there is no need to point it out!
