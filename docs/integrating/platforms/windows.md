
# Distributing Windows builds

## Common game engines (Unity, etc.)

Game engines like Unity take care of everything. Their export is usually a folder
that you can push with [butler][], or zip up and upload via the itch.io dashboard.

The app will install and run those without any issues.

## Ship a portable build

Instead of shipping an installer (`MyGame_setup.exe` or `MyGame.msi`), consider simply
shipping a .zip archive of your game.

Better yet, use [butler](https://itch.io/docs/butler/) to push your release folder
directly. It'll take care of compression and patching for you.

For a longer explanation of why portable builds matter, read the [Single files](https://itch.io/docs/butler/single-files.html) page
of the butler documentation.

## Prerequisites (Visual C++, .NET, XNA, DirectX)

If your game depends the Visual C++ Runtime, the .NET Framework, the XNA
Framework, DirectX or so, please look at the
[Prerequisites](../prereqs/README.md) feature of the itch app - it can
install those for your players before the first launc of your game.

## Don't bother with 64-bit builds

Unlike 64-bit Linux, 64-bit Windows will happily run 32-bit binaries. There might
be some technical reasons for your game to require a 64-bit binary, in which case
reading this page is probably a waste of your time and you should just apply the
knowledge you already have.

## Supported installer types

Some installers allow *silent installation*. In this case, the itch app detects
them and tries to silently install to the [install location][] specified by the
user.

In particular, these installers are supported:

  * InnoSetup installers
  * NSIS installers
  * InstallShield self-extracting archives (some versions)

Uninstalling games from the app will also attempt to run the uninstaller properly,
but if it fails, will resort to wiping the installation folder, which the user
would most probably do if the app didn't.

## Dependency hell, Windows-style

Figuring out what your app depends on is easier on Windows that it is on
Linux, for example, but can still get tricky.

One way to solve it is to have a clean install of Windows in a virtual machine or
another computer, and copy your game there: if it runs, you're fine. If it complains
about some library, add it. However, this trial-and-error can take a while.

Instead, you could use a tool like [Dependency Walker][depends], which will
monitor the DLLs (dynamic libraries) that your application loads throughout
its runtime.

[depends]: http://www.dependencywalker.com/

## Libraries with known gotchas

### OpenAL

OpenAL, like OpenGL, was supposed to be a standard that various vendors implement
themselves. It worked okay for OpenGL, but OpenAL not so much. If you expect your
players to have a working OpenAL driver installed, you're going to have a bad time.

A good idea is to distribute a build of OpenAL-soft with your game:

  * <http://kcat.strangesoft.net/openal.html>

It'll work out of the box for everyone, it supports fun stuff like [HRTF][] out-of-the-box,
and tinkerers can always swap it for their favorite OpenAL implementation!

[HRTF]: https://en.wikipedia.org/wiki/Head-related_transfer_function

[butler]: https://itch.io/docs/butler/
[install location]: ../../using/install-locations.md
