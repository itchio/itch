
## Goals

Simplify itch's codebase greatly.

## Webpack

Boo.

## Browser

The browser part of the app will be removed completely.

Users are encouraged to use their desktop browsers instead.

## Broth

Broth (itch's dependency system) should die.

It's not antivirus-friendly, and there's more likelihood that
the app will break itself rather than fix itself!

butler & itch-setup should be bundled with the app, so that
no additional download is required.

## Redux

Redux was used wayyy back in the original versions of the app.

We use a convoluted system to have side-effects. I'd like to
minimize app state duplication and RPC traffic instead.
