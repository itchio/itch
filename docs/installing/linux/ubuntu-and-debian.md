
# Installing itch on Ubuntu & Debian

While you can simply head to <https://itch.io/app> and grab the latest .deb, we
recommend you add our package repository instead, so that the app can remain
up-to-date.

## Adding our APT repository

We publish .deb packages of every release on Bintray:

  * <https://bintray.com/itchio/deb>

*Note: on Debian, you may need to `sudo apt-get install apt-transport-https` before you
follow the rest of this guide*

### Importing our GPG key

The packages we publish are digitally signed, so that you can ensure that we
are the ones that published it, and no one else.

To allow your package manager to verify those signatures, you need to import our
GPG key. You can do so by running the following command in a terminal:

```bash
curl https://dl.itch.ovh/archive.key | sudo apt-key add -
```

This will prompt for your password, since `sudo` is used.

### Adding to your sources.list.d

Then, either use [Ubuntu's graphical tools][ubuntools] to add our repository,
or run one of the following group of commands in your terminal:

```bash
ITCHIO_DEB="deb https://dl.bintray.com/itchio/deb xenial main"
echo $ITCHIO_DEB | sudo tee /etc/apt/sources.list.d/itchio.list

ITCHIO_DEB="deb https://dl.bintray.com/itchio/deb wily main"
echo $ITCHIO_DEB | sudo tee /etc/apt/sources.list.d/itchio.list

ITCHIO_DEB="deb https://dl.bintray.com/itchio/deb vivid main"
echo $ITCHIO_DEB | sudo tee /etc/apt/sources.list.d/itchio.list

ITCHIO_DEB="deb https://dl.bintray.com/itchio/deb jessie main"
echo $ITCHIO_DEB | sudo tee /etc/apt/sources.list.d/itchio.list

ITCHIO_DEB="deb https://dl.bintray.com/itchio/deb wheezy main"
echo $ITCHIO_DEB | sudo tee /etc/apt/sources.list.d/itchio.list
```

**The codenames correspond to a given distribution:**

  * `xenial` for Ubuntu 16.04
  * `wily` for Ubuntu 15.10
  * `vivid` for Ubuntu 15.04, etc.
  * `jessie` for Debian 8.x
  * `wheezy` for Debian 7.x

When in doubt, you can use the `lsb_release -c` command (from the `lsb-release` package)
to print the codename of your Debian-based distribution.

[ubuntools]: https://help.ubuntu.com/community/Repositories/Ubuntu#Adding_Other_Repositories

## Installing & updating

If you have successfully added our package repository, installing should be as simple as
running `sudo apt-get update && sudo apt-get install itch` from a terminal.

The package provides:

  * An applications menu shortcut (via a .desktop file)
  * The `/usr/bin/itch` launcher script, for command-line usage

Refer to your distribution's manual to know how to keep packages up-to-date.
Most desktop environments have some sort of graphical interface to prompt you to
install updates, and you can always run `sudo apt-get update && sudo apt-get
upgrade` yourself in a terminal.

## Uninstalling

Simply run `sudo apt-get remove itch` to uninstall itch from your system.

Note that this won't remove your library, which resides at `$HOME/.config/itch`,
along with any additional install locations you have added from the app.

*`$HOME` is your personal directory, for example: /home/you*
