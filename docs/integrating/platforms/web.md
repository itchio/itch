
(Placeholder)

The default unity web export is annoying but the app handles it semi-well

As long as your game renders to a canvas, you should be fine.

Describe behavior of the app in fullscreen, mention influence of 'width/height'
settings in edit game page (it tries to keep the ratio)

Mention black background, don't leave the default background color in your
Twine exports.

Game pages that aren't of type `web` won't work as web games even if
they ship an executable-less archive with an `index.html` somewhere.
(Twine compilations are particularly affected by that, need manifest supported
  asap.)
