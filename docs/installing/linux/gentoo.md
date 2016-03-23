
# Installing itch on Gentoo

At the time of this writing, there is no PKGBUILD available for itch in
any overlay, that we know of.

However, I (Amos) hold a special place in my heart for Gentoo, having used it
for several years during my college days, and although I don't have the time
to maintain one, if someone feels like maintaining a PKGBUILD for itch, I would
be happy to provide support.

If you're interested, please [open a new issue](https://github.com/itchio/itch/issues/new)
to start a discussion!

## Git installation

In the meantime, you can always:

  * `npm install -g electron-prebuilt grunt-cli`
  * `git clone https://github.com/itchio/itch`
  * `cd itch`
  * `git checkout SOME_STABLE_VERSION` (refer to <https://github.com/itchio/itch/releases>)
  * `npm install`
  * `NODE_ENV=production npm start` to launch the app

You could put the launch command in a script somewhere in your `$PATH`.

There are .desktop file templates in `release/` that you could adapt.
