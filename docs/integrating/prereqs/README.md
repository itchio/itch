
# Prerequisites

Since we encourage developers to ship [portable builds](../platforms/windows.md), the app supports
installing frameworks or libraries your game might depend on.

Here's how it looks for users:

![](./user-flow.gif)

## Adding prereqs to the manifest

The simplest possible manifest would look something like

```toml
[[actions]]
name = "play"
path = "Game.exe"
```

(As a file named `.itch.toml` at the root of your game's folder. See [Manifest files](../manifest.md) for more details)

Each prerequisite you want just needs its own `[[prereqs]]` entry. For example, if
your game depends on XNA 4.0 and Visual C++ 2010, you could ship the following manifest:

```toml
[[actions]]
name = "play"
path = "Game.exe"

[[prereqs]]
name = "vcredist-2010-x86"

[[prereqs]]
name = "xna-4.0"
```

Prerequisites are not tied to any particular action — any time a "Windows executable" action
is launched, prerequisites will be verified, and if needed, downloaded and installed.

## Available prerequisites

Each category of prerequisite has its own page:

  * [Visual C++ Runtime](./vc.md)
  * [.NET Framework](./dotnet.md)
  * [XNA Framework](./xna.md)
  * [DirectX](./dx.md)

If your game needs a prerequisite that's not on the list, please [open an
issue](https://github.com/itchio/itch/issues/new) so we can add it to our
repository. Please consult the list of [requested
prerequisites](https://github.com/itchio/itch/labels/prereqs) first to avoid
opening duplicate requests!
