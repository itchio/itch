
# Integrating your games with itch

When the app was first released, in late 2015, itch.io had already existed for
a while, and a lot of content was already on there.

We wanted to keep the simplicity that itch.io is known for: to be able to
distribute an entirely new game in only a few clicks from the comfort of
your web browser.

As a result, the app contains a certain amount of heuristics (or: guessing
strategies) that allow it to *do the right thing* most of the time.

On occasion, heuristics fail, and games fail to install, or launch, or launch
the wrong executable, etc. For these cases, there are usually two fixes:

  * Improving the heuristics
    * For example, asking the question "Would a human have made that mistake?"
    and if not, trying to emulate human behavior. Examples: looking at file sizes,
    looking for an icon, avoiding executables containing the word `uninstall`, etc.
  * Providing configuration options

The latter allows creators themselves to disambiguate questions like
"which executables should be launched by the app", etc. At the time of this,
writing, no such options exist in the app, but they are currently [under discussion][manifest].

A manifest format needs to be well thought-out so that it may remain relevant
for years to come, and avoid version incompatibility. It will come in later versions
of the app, but for now, this book describes the various heuristics used by the app instead.

[manifest]: https://github.com/itchio/itch/issues/92
