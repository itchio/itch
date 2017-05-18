
These environment variables will change the behavior of the app:

  * `DEVTOOLS=1` — start with Chromium Devtools open — useful when something goes
    wrong before the `F12` binding becomes available.
  * `MARCO_POLO=1` — dumps all redux events being dispatched throughout the app.
    We attempt to filter that (see `private` field in payloads) but **please
    pay extra care to any logs you post publicly** to make sure you're not leaking
    your own credentials.
  * `REDUX_DEVTOOLS=1`
  * `LET_ME_IN=1` — dump itch.io API calls to console
  * `DIEGO_IS_ASLEEP=1` - forbid [our diagnostics tool][diego] from running commands like
    `uname`, `lspci`, `sw_vers`, `wmic`, and `ver` on your system and writing
    the results to a file on your local disk.
  * `CAST_NO_SHADOW=1` — opens devtools for the purchase window
  * `TRUST_ME_IM_AN_ENGINEER=1` - never show `Buy now` instead of `Install`.
    Obviously, the backend has to agree with you.
  * `REMEMBER_ME_WHEN_IM_GONE=1` - don't wipe downloads when uninstalling.
    Useful for debugging install/uninstall routines.
  * `THE_DEPTHS_OF_THE_SOUL=1` - print debug info when extracting certain archives
  * `IMMEDIATE_NOSE_DIVE=1` - open dev tools before launching html games
  * `UP_TO_SCRATCH=1` - force update checks, even in development environment
  * `MY_BUTLER_IS_MY_FRIEND=1` - show butler debug messages
  * `MY_BUTLER_IS_MY_ENEMY=1` - show all of butler's output before parsing
  * `PROFILE_REQUIRE=1` - profile how much time it takes to require modules
  * `ITCH_IGNORE_CERTIFICATE_ERRORS=1` - ignore certificate errors - USE WITH CARE only with debugging proxies that do SSL proxying
  * `ITCH_EMULATE_OFFLINE=1` - simulate a network outage

See the "Performance hacking" section for other environment variables that impact the app.