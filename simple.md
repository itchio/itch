
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

butler should be provided as a library, using `@itchio/valet`.

Also, itch-setup should be bundled with the app.

## Redux

Redux was used wayyy back in the original versions of the app.

We use a convoluted system to have side-effects. I'd like to
minimize app state duplication and RPC traffic instead.

## webpack / module bundling / `node_modules`

The only required `node_modules` are `ws` and `@itchio/valet`, with deps:

```
buffer-from  source-map  source-map-support  @itchio/valet  ws
```

However, `ws` dependency should be removed.

Everything else is bundled by webpack.

## Modclean  

modclean can be entirely deprecated - instead removing everything except `@itchio/valet`.

As for `@itchio/valet`, the whole `target` directory can be wiped, and `native/index.node` can be 
stripped. Remains to be seen whether stripping breaks anything with a Go library statically
linked.



