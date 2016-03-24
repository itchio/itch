
# Distributing Web games

Web games have several advantages:

  * They're easily accessible from web browsers
  * They're less of a security threat than native games
  * They work on all three platforms out of the box

However, they also tend to perform more poorly, and to have worse
platform integration.

Since version v0.14.0, the itch app supports installing and launching
web games. Like the website, it will look for an `index.html` file to
show.

*Note: game pages that aren't of type `web` won't work as web games even if
they ship an executable-less archive with an `index.html` somewhere.
(Twine compilations are particularly affected by that, need manifest support
 to work around that)*

## Fullscreen

As long as your game renders to a canvas, you should be fine.

Describe behavior of the app in fullscreen, mention influence of 'width/height'
settings in edit game page (it tries to keep the ratio)

Mention black background, don't leave the default background color in your
Twine exports.

## Engine-specific notes

### Unity WebGL

The default Unity WebGL export includes an interface around the canvas, with
the project's name and its own fullscreen button. The itch app attempts to hide
that so that the game fills the entire window.

### Unity plug-in

So-called *Unity plug-in* games aren't web games. They require a proprietary
browser plug-in to run, and aren't supported by the app. They're also being
actively phased out by Unity, and incompatible with at least one major browsers
(Google Chrome).
