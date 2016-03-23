
# Installing itch on ArchLinux

There is an AUR package available to install itch:

  * <https://aur.archlinux.org/packages/itch/>

While we (itch.io core team) try to bump it on occasion, it is a best-effort package
that may lag one day or two behind official releases.

Thanks to the way ArchLinux user packages are organized, though, you can help!
The [Creating packages](https://wiki.archlinux.org/index.php/Creating_packages)
wiki page is a good reference, and someone on the [AUR page][] posted a script
to make it easier to update the package.

The [AUR page][] is also the right place to discuss ArchLinux-specific itch problems.

[AUR page]: https://aur.archlinux.org/packages/itch/

## Known issues

There is an ongoing issue going on with the AUR version of itch, discussed
in [this GitHub issue](https://github.com/itchio/itch/issues/458). It seems to
be a renderer crash when getting past login.

While it is not resolved yet, reports indicate that manually installing from git
works around those issues. Please refer to the [Gentoo section](gentoo.md) for
Git installation instructions.
