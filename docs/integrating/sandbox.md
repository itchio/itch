
# The itch.io sandbox (for game developers)

The itch.io sandbox tries to prevent several typical attacks
a malicious game could run on a computer. For example, the sandbox
will:

  * Limit what files a process can read
  * Limit what files a process can write to
    * On Linux, be more permissive about writes, but redirect them to a safe, per-game folder
  * On Windows, run games as a different, less-privileged user

### Additional notes

It shouldn't be possible to escape the sandbox by forking/spawning/execing.

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
