
# macOS sandboxing

The itch.io sandbox uses built-in macOS facility `sandbox-exec`.

It dynamically generates sandbox policy when launching a game, which:

  * gives read access to the usual things needed by games
  * gives write access to a few ~/Library folders
  * explicitly denies a few known sensitive locations

Here's the policy template the itch app uses:

  * <https://github.com/itchio/itch/blob/master/src/constants/sandbox-policies/macos-template.js>

## Troubleshooting

If your game is broken by the itch.io sandbox on macOS, we recommend using
the built-in `Console.app` to watch out for permission denials. Look in
particular for `sandboxd` messages.

Since Console.app shows system-wide logs for all applications, it may be a bit
chatty. Shutting down applications you don't actively use can help reduce
the amount of irrelevant messages.

The default sandbox policy should be more than enough to get most games running,
but if you run into an issue that you need help resolving, feel free to open
an issue on our [Issue Tracker](https://github.com/itchio/itch/issues)
