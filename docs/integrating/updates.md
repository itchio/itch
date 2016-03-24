
# How updates work

Up to version v0.13.x, the itch app only looked for game updates on startup.

From v0.14.x on, it looks for updates regularly.

File names aren't parsed for version numbers — instead, the topmost file wins,
with the following caveats:

  * `.7z` files are preferred to `.zip`
  * `.zip` files are preferred to `.exe`
  * `.rar`, `.rpm` and `.deb` files are never even considered
  * Untagged (platform-less) uploads are ignored by the app, cf.

## How an update is applied

The app follows the these steps:

  * The new version is extracted in a temporary folder
  * The new and old versions are compared
  * Files that were in the previous version but disappeared in the new version
  are removed from the install target
  * The temporary folder is merged with the install target

If the game creates files (savefiles, user profiles, etc.) during runtime,
this will retain them, while removing obsolete data or binary files.

## Incremental updates

We're working on a set of open-source diff/patching tools. The first
public announcement is [on the itch.io community forums](https://itch.io/post/16715).
