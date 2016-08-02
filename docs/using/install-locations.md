
# Install locations

Install locations are folders that the itch app installs games to. The initial
install location is in a folder your user has write access to without requiring
administrator rights.

*That's why games aren't installed to `Program Files` on Windows. As a rule,
the app can be installed and used without ever asking for Administrator
privileges, except for [sandbox setup](sandbox.md) or third-party installers.*

## Changing the default install location

In the preferences tab, whichever location is highlighted in hot pink is the one
new installs will be installed to.

To change the location games are installed to, add a new one by clicking the
`Add location` button, then click on its name to set it as default.

## Removing install locations

You can only remove locations that no games are currently installed in. To
see all games installed in a location, click the folder icon.

## Moving game installs between install locations

The only way to do this at the moment is to uninstall a game, then install it
again (after having set another location as default).

*Part of the reason is that some games use external installers, which could
set up programs that rely on being installed at a certain path. Moving them
would break the install. We [have a plan](https://github.com/itchio/itch/issues/671) for that.*
