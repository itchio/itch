
# QA Checklist

This is a non-exhaustive things of stuff to look out for when testing a
new version before release[^1]

* installer
  * on windows, if at startup the shortcut was deleted, keep it that way

* login / setup
  * failed login attempt should focus on password
  * Allow access to hub regardless of whether login or setup finished first
  * app should remember logins by default
  * app should allow forgetting logins
    * but protect that with a confirmation prompt

* i18n updates should not prevent startup even if
  * server is down
  * server returns invalid JSON document
  * server returns empty JSON document

* relaunching app should pick up cave tasks where they left off
  * resume downloads
  * restart installations

* launching html games
  * should use right window size
  * F11 and Esc should work

* install formats
  * various types
    * zip should work
    * dmg should work
    * installshield exe should work
    * innosetup exe should work
    * installer inside a zip should work
  * should be able to reinstall + uninstall all of the above

[^1]: For example, the [canary release](../installing/canary.md)
