
# macOS sandboxing

The itch.io sandbox uses built-in macOS facility `sandbox-exec`.

It dynamically generates sandbox policy when launching a game, which:

  * gives read access to the usual things needed by games
  * gives write access to a few ~/Library folders
  * explicitly denies a few known sensitive locations

Here's the policy template the itch app uses:

  * <https://github.com/itchio/itch/blob/master/appsrc/constants/sandbox-policies/macos-template.js>
