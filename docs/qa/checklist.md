
* login / setup
  * failed login attempt should focus on password
  * Allow access to hub regardless of whether login or setup finished first

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
