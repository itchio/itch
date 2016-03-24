
# Distributing Windows builds

The Windows ecosystem is — to be perfectly honest — a beautiful mess, but it is
an easy target for game developers.

## Common game engines (Unity, etc.)

Game engines like Unity take care of everything. Their export is usually a folder
that you can just zip up and upload to itch.io, the app will install and run them,
no questions asked.

## Don't bother with 64-bit builds

Unlike 64-bit Linux, 64-bit Windows will happily run 32-bit binaries. There might
be some technical reasons for your game to require a 64-bit binary, in which case
reading this page is probably a waste of your time and you should just apply the
knowledge you already have.

## Avoid installers

Installers are useful for applications that require special setup steps or
integration into the system, like services, or administrative software, or
system-wide utilities.

However, games are usually self-contained experiences that can live entirely
in user-owned folders without messing with the system itself. Hence, in *most cases*,
installers are superfluous and should be avoided

Instead, a simple .zip archive containing the executable, its assets, and the
required DLLs (see the `Dependency hell` section below) should be enough for both
a human (Windows has had built-in .zip support for a while) and the itch app.

The exception, of course, is some dependencies which come in the form of
redistributables, such as the .NET Framework, the Visual C++ Runtime, etc.

Since the app has no built-in mechanism to install those *yet*, it is reasonable
to distribute an installer for those reasons, for the time being.

*Reminder: those are suggestions for best compatibility. Do what you want, it's your game.*

Some installers allow *silent installation*. In this case, the itch app detects
them and tries to silently install to the [install location][] specified by the
user.

In particular, those installers are supported:

  * InnoSetup installers
  * NSIS installers
  * Adobe Air installers (with [caveats][air-issues])
  * Some InstallShield self-extracting archives

[air-issues]: https://github.com/itchio/itch/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+adobe+air

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

## Special mentions of the jury

Some libraries have well-known gotchas: an incomplete list follows.

### OpenAL

OpenAL, like OpenGL, was supposed to be a standard that various vendors implement
themselves. It worked okay for OpenGL, but OpenAL not so much. If you expect your
players to have a working OpenAL driver installed, you're going to have a bad time.

A good idea is to distribute a build of OpenAL-soft with your game:

  * <http://kcat.strangesoft.net/openal.html>

It'll work out of the box for everyone, it supports fun stuff like [HRTF][] out-of-the-box,
and tinkerers can always swap it for their favorite OpenAL implementation!

[HRTF]: https://en.wikipedia.org/wiki/Head-related_transfer_function
