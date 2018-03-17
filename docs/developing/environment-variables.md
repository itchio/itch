
These environment variables will change the behavior of the app:

  * `DEVTOOLS=1` — start with Chromium Devtools open — useful when something goes
    wrong before the `F12` binding becomes available.
  * `ITCH_LOG_LEVEL=debug` — see `logger/index` for available levels - defaults to "info"
  * `DEBUG=buse:*` — show all debug messages related to communicating with the butler service.
  * `MARCO_POLO=1` — dumps all redux events being dispatched throughout the app.
    We attempt to filter that (see `private` field in payloads) but **please
    pay extra care to any logs you post publicly** to make sure you're not leaking
    your own credentials.
  * `DIEGO_IS_ASLEEP=1` - forbid [our diagnostics tool][diego] from running commands like
    `uname`, `lspci`, `sw_vers`, `wmic`, and `ver` on your system and writing
    the results to a file on your local disk.
  * `REMEMBER_ME_WHEN_IM_GONE=1` - don't wipe downloads when uninstalling.
    Useful for debugging install/uninstall routines.
  * `IMMEDIATE_NOSE_DIVE=1` - open dev tools before launching html games
  * `UP_TO_SCRATCH=1` - force update checks, even in development environment
  * `PROFILE_REQUIRE=1` - profile how much time it takes to require modules
  * `ITCH_IGNORE_CERTIFICATE_ERRORS=1` - ignore certificate errors - USE WITH CARE only with debugging proxies that do SSL proxying
  * `ITCH_EMULATE_OFFLINE=1` - simulate a network outage

See the "Diving into performance" section for other environment variables that impact the app.