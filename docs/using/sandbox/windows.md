
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
