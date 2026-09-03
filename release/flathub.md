# Publishing the itch app on Flathub

The Flathub package is `io.itch.itch`, maintained in
https://github.com/flathub/io.itch.itch. It downloads the linux-amd64 zip from
broth and wraps it with zypak and a Wine base runtime. The app runs inside the
flatpak sandbox and updates come from Flathub, not from our own updater.

We don't push builds anywhere. Flathub's bot watches
https://broth.itch.zone/itch/linux-amd64/LATEST and opens a PR against the
flathub repo when it changes. The PR bumps the archive URL and sha256 in
`io.itch.itch.yaml` and adds a release entry to `io.itch.itch.metainfo.xml`.

## Each app release

1. After the broth push, check https://github.com/flathub/io.itch.itch/pulls
   for the bot's PR. It shows up within a day.
2. Wait for the "Test build succeeded" comment. To try it before merging,
   install from the testing repo link in that comment.
3. Check the release entry the bot added to the metainfo. Version must not
   have a `v` prefix. Add a `<url>` to the GitHub release if it's missing.
4. Merge. Flathub builds and publishes on its own, usually within a few hours.
5. Close any older bot PRs for versions that were skipped.

## When the app itself changes

Things in the flathub repo that need a manual PR:

- `finish-args` in `io.itch.itch.yaml`: new D-Bus names, devices, or env the
  app needs. Games launched with `flatpak-spawn --sandbox` need
  `--talk-name=org.freedesktop.Flatpak`.
- `itch-run`: the launcher script, holds the Electron/Ozone flags.
- `io.itch.itch.metainfo.xml`: description, screenshots, links.

Local build to test manifest changes:

```sh
flatpak-builder build-dir io.itch.itch.yaml --install --user --force-clean
flatpak run io.itch.itch
```
