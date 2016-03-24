
# Getting your game up and running

Here's a crash course on getting your game running within the itch app — chances are, it already works!

## Tag your uploads

The itch app tries to guess a lot of thing, but it relies on you to tell
it what to download for which platform. You can do so by checking the
appropriate checkbox in the 'Edit game' page.

![](tags.png)

*The icons represent, in order: Windows, Linux, Mac OSX, and Android*

You can distribute binaries for several platforms in a single archive,
if you want. The itch app will look for the right kind of binary to launch
on the appropriate platform.

## Keep a simple directory structure

The app tries to mimic a human when launching a game. The general rule
is: **the topmost executable wins**. If you are also distributing a
level editor, etc., you can make sure the app doesn't launch them as
the primary action by putting them in a `tools/` subdirectory.

Additionally:

  * The app can tell the difference between Linux, Mac OS, and Windows
  executables — which allows you to distribute all three in a single archive.
  * The app will set the executable bit on every binary it can find before
  attempting to launch the game, salvaging badly-zipped archives.
  * The app actively avoids files containing strings resembling `uninstall`
  * The app will prefer shell scripts to binaries on Linux (allowing you to
    set up the `LD_LIBRARY_PATH` correctly, for example)

## Use simple archive formats

Some installers are supported, but if you can distribute your
game as a simple archive, it provides a better experience *through the app*.

*Note: Unity exports work out of the box.*

**Don't use RAR:** it is an obsolete and non-free archive format and is
not supported by the itch app. Check out [this thread][no-rar] for more details

[no-rar]: https://itch.io/t/11918/rar-support-is-not-happening-repack-your-games

## Test your games

The itch app will let you install all your own projects, whether they
 have a minimum price or not. If you need help testing your game, here are
 places you can look for testers:

  * The [itch.io community forums](https://itch.io/community)
  * The [itch.io chat](https://itch.io/chat)
