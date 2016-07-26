
# How updates work

Up to version v0.13.x, the itch app only looked for game updates on startup.

From v0.14.x on, it looks for updates regularly.

File names aren't parsed for version numbers — instead, the topmost file wins,
with the following caveats:

  * `.7z` files are preferred to `.zip`
  * `.zip` files are preferred to `.exe`
  * `.rpm` and `.deb` files are never even considered
  * Untagged (platform-less) uploads are ignored by the app, cf.

## Uploading a new version

For now, when uploading a new file on itch.io:

  * Uploading a file with the exact same name will:
    * Replace the previous one
    * Keep the stats (download count)
    * Temporarily make that download unavailable, while it's being uploaded
  * Uploading a new file and deleting the old one will lose the stats,
  but there'll be no downtime.
    * Don't forget to tag it with the right platform again
    * Alternatively, 'hiding' the old download will allow you to keep the stats
    for a while.

Needless to say, this process isn't ideal for often-updated games, and a proper
versioning system is coming.

We're working on a set of open-source diff/patching tools. The first
public announcement is [on the itch.io community forums](https://itch.io/post/16715),
and you can help us test them right now.

## How an update is applied

The app follows the these steps:

  * The new version is extracted in a temporary folder
  * The new and old versions are compared
  * Files that were in the previous version but disappeared in the new version
  are removed from the install target
  * The temporary folder is merged with the install target

If the game creates files (savefiles, user profiles, etc.) during runtime,
this will retain them, while removing obsolete data or binary files.
