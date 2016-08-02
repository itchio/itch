
# Distributing OSX builds

OSX might just be the ideal platform to distribute third-party, proprietary apps.

The canonical way to do it is simply to distribute a zipped app bundles,
e.g. `Your Game.app.zip`.

App bundles are directory with a standardized structure and some metadata
in an `Info.plist` file. Here's a [good stackoverflow thread][so-app] on how
they're created.

[so-app]: http://stackoverflow.com/questions/1596945/building-osx-app-bundle

## Permissions

macOS is a BSD, so it needs the executable bit to be set before launch any program,
however, *the itch app takes care of that*. When installing a game, it scans for
executables and fixes permissions if they're set incorrectly.

Be aware, though, that if players try to download and play your game without
using the itch app, they won't be able to play it (cf. [Error -10810](http://www.thexlab.com/faqs/error-10810.html))

In an interesting twist of events, **if you upload your game using the
[butler](https://itch.io/docs/butler) command-line upload tool, it will also
fix permissions for you.**

## macOS security policy

For players that are *not* using the itch app, you might get reports of your app
being "Damaged and can't be opened" and that it should "be moved to the trash".

Distributing through the app avoids these issues, so you might want to
encourage your players to use <https://itch.io/app> to play your game.

The underlying reason is as follows:

  * Apple wants all developers to sign their app
  * Which requires a $99/year code certificate (and one week of figuring out
    the right invocation, along with a macOS install handy)
  * ...and doesn't actually prevent malware (but makes it easier to blacklist)

Sandboxing is a little better, and Apple does it for Mac App Store apps.
We also do it, in a [much less constraining way](../../using/sandbox.md).

Other "fixes" floating around the web encourage users to disable macOS's checks
for signed apps. Don't do that.
