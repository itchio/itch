
# Distributing OSX builds

OSX might just be the ideal platform to distribute third-party, proprietary apps.

The canonical way to do it is simply to distribute a zipped app bundles,
e.g. `Your Game.app.zip`.

App bundles are directory with a standardized structure and some metadata
in an `Info.plist` file. Here's a [good stackoverflow thread][so-app] on how
they're created.

[so-app]: http://stackoverflow.com/questions/1596945/building-osx-app-bundle
