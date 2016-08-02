
# How updates work

The itch app looks for game updates on start-up, and every 30 minutes.

If there's only one candidate (a single file tagged `windows` for example),
it gets downloaded and installed immediately. Otherwise, the user is prompted
to pick from a list.

For updates, the same logic applies: if the user had to pick between multiple
alternatives, the app will ask them to pick again whenew files are available.

Otherwise, it'll update automatically to the newer version of the only
candidate.

## Uploading a new version

The best way to upload a new version of your game is to use [butler](https://itch.io/docs/butler),
our command-line uploader. It's faster both for you and for your players, as butler
will only upload the differences from the older version.

Read [Pushing builds with butler](https://itch.io/docs/butler/pushing.html) to
get up and running in no time.

When updating a game uploaded with butler, the app will only download a small patch.
Since it's a command-line tool, you can easily integrate it into your release workflow

## Uploading a new version (alternative)

If for some reason you can't or won't use butler, you can upload a new file
to itch.io using the web interface.

For now, when uploading a new file on itch.io:

  * Uploading a file with the exact same name will:
    * Replace the previous one
    * Keep the stats (download count)
    * Temporarily make that download unavailable, while it's being uploaded (known issue)

  * Uploading a new file and deleting the old one will lose the stats,
  but there'll be no downtime.
    * Don't forget to tag it with the right platform again
    * Alternatively, 'hiding' the old download will allow you to keep the stats
    for a while.

Needless to say, this process isn't ideal for often-updated games, and we
recommand using [butler](https://itch.io/docs/butler) instead.

## How an update is applied

When applying an update, files that were in the previous version but disappeared
in the new version are removed from the install folder.

That way, if the game creates files (savefiles, user profiles, etc.) during runtime,
this will retain them, while removing obsolete data or binary files.
