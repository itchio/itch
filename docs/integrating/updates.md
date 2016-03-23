
(Placeholder)

Old app checked only on startup

New app will check regularly (every half hour or so)

Update process:

  * Unpack new version in temp folder
  * Compare existing folder with temp folder
  * Remove files that were in previous version but disappeared in new
  * Merge temp folder with existing folder

This retains app-created files, while cleaning up dev-deleted files.

Mention butler, diff/patches, upcoming wharf backend.
