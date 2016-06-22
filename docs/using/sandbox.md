
# The itch.io sandbox

The itch.io sandbox tries to prevent several typical attacks
a malicious game could run on a computer. For example, the sandbox
will:

  * Limit what files a process can read
  * Limit what files a process can write to
    * On Linux, be more permissive about writes, but redirect them to a safe, per-game folder
  * On Windows, run games as a different, less-privileged user

## Scope

Attacks that the itch.io sandbox try to prevent include:

### Stealing your itch.io credentials

This is especially important if you're a developer. Someone stealing your
butler API key could push a malicious build of your game to all your players.

### Stealing your browser cookies / saved passwords

This affects everyone. See [pycookiecheat](https://github.com/n8henrie/pycookiecheat)
for an example of how easy it is to decrypt Chrome's cookies.

Stealing saved passwords is especially scary as it can happen no matter
how secure the servers are, see the [2016 twitter leak](https://www.leakedsource.com/blog/twitter)

### Additional notes

It shouldn't be possible to escape the sandbox by forking/spawning/execing

The sandbox makes no attempts to protect against:
  * The user collaborating in being attacked (giving out their password, running untrusted software, etc.)
  * Vulnerabilities in graphics drivers (see WebGL security history)

It's not the answer to everything, but running games via the sandbox
is much safer than not doing so.

### Implementation

For implementation details, please refer to the following platform-specific pages:

  * [Windows sandboxing](sandbox/windows.md)
  * [macOS sandboxing](sandbox/macos.md)
  * [Linux sandboxing](sandbox/linux.md)
