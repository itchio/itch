
# Windows sandboxing

## One-time setup

For sandboxing to work, the itch app needs to create a new account named
`itch-player`, by running the following commands:

```bat
net user itch-player salt /add
net localgroup Users itch-player /delete
```

The first command adds the `itch-player` user with a known password, and
the second command removes it from the `Users` group so that it doesn't
appear on the login screen.

As a result, the `C:\Users\itch-player` folder will be created, and that's
where game saves will go.

## Troubleshooting

If your game is broken by the itch.io sandbox on Windows, we recommend using
[Sysinternals' Process Monitor](https://technet.microsoft.com/en-us/sysinternals/processmonitor.aspx)
to see what the game is trying to access that it doesn't have permissions to.

You may need to filter by executable name for the logs to be readable (if someone
 wants to supply a tutorial article on this, they're more than welcome!)

The default sandbox policy should be more than enough to get most games running,
but if you run into an issue that you need help resolving, feel free to open
an issue on our [Issue Tracker](https://github.com/itchio/itch/issues)

## Frequently Asked Questions

### I have a new folder in C:\\Users\\, what gives?

This is necessary for the sandbox to function properly, since it runs games
as another user. It's a small price to pay for much-increased security, and
allows itch to protect all your personal files from malicious games that
would want to steal them.

### I lost my saves when enabling the sandbox

Fear not! They're still here, just in `C:\\Users\\yourself`, rather than
`C:\\Users\\itch-player`, which explains why the game doesn't find it anymore.

You can copy over your savefiles, if you know where they are, for example:

   * Original location: `C:\\Users\\leaf\\AppData\\Roaming\\com.unity.game`
   * New location: `C:\\Users\\itch-player\\AppData\\Roaming\\com.unity.game`

You'll also need to grant full access to this folder to the `itch-player` account,
by right-clicking on the folder in the Explorer, and setting the right permissions there.
