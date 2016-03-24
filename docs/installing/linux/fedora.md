
# Installing itch on Fedora

While you can simply head to <https://itch.io/app> and grab the latest .rpm, we
recommend you add our package repository instead, so that the app can remain
up-to-date.

## Adding our YUM repository

We publish .rpm packages of every release on Bintray:

  * <https://bintray.com/itchio/rpm>

### Importing our GPG key

The packages we publish are digitally signed, so that you can ensure that we
are the ones that published it, and no one else.

To allow your package manager to verify those signatures, you need to import our
GPG key. You can do so by running the following command in a terminal:

```bash
sudo rpm --import https://dl.itch.ovh/archive.key
```

This will prompt for your password, since `sudo` is used.

### Adding the .repo file

```bash
wget https://bintray.com/itchio/rpm/rpm -O itchio.repo
sudo mv itchio.repo /etc/yum.repos.d/
```

## Installing & updating

If you have successfully added our package repository, installing should be as simple as
running `sudo yum install itch` from a terminal.

The package provides:

  * An applications menu shortcut (via a .desktop file)
  * The `/usr/bin/itch` launcher script, for command-line usage

Refer to your distribution's manual to know how to keep packages up-to-date.
Most desktop environments have some sort of graphical interface to prompt you to
install updates, and you can always run `sudo yum update` yourself in a terminal.

## Uninstalling

Simply run `sudo yum remove itch` to uninstall itch from your system.

Note that this won't remove your library, which resides at `$HOME/.config/itch`,
along with any additional install locations you have added from the app.

*`$HOME` is your personal directory, for example: /home/you*
