
# Linux sandboxing

On Linux, the itch app uses [firejail](https://github.com/netblue30/firejail)
to sandbox applications. It's similar to macOS's `sandbox-exec`: applies
a simple policy file, based on seccomp-bpf, will work on any Linux kernel >3.x,
doesn't rely on SELinux/AppArmor

Instead of running as a different user, firejail intercepts syscalls
and even has advanced functionality like exposing a virtual filesystem
so that changes can be recorded and later committed or discarded (this way,
the sandboxed application won't fail, the worst case scenario is: some things
won't persist across app restarts).

## One-time setup

Due to the way firejail works, its binary needs to be SUID root - which means
that, when executed by any user, it'll be as if it was run by root. Sandboxed
applications however do *NOT* have root privilege.

To make the firejail binary SUID, the following commands have to be run:

```bash
sudo chown root:root ~/.config/bin/firejail
sudo chmod u+s ~/.config/bin/firejail
```

These commands have to be run as root, and that's why the itch app warns you that
a password prompt (powered by `pkexec`) is coming. If you want to do
those operations by hand, simply dismiss the prompt, and chown/chmod
the binary yourself. You can find it in `~/.config/itch/bin/firejail`.

You can verify that the one-time setup went well by running:

```bash
~/.config/bin/firejail whoami && echo "All good!"
```

...and checking that the output include "All good!". An incorrectly setup
firejail will result in the following output:

```
$ ~/.config/itch/bin/firejail whoami
Warning: cannot switch euid to root
Warning: cannot switch euid to root
Warning: cannot switch euid to root
Error: the sandbox is not setuid root
```

## Frequently Asked Questions

### Why use firejail and not SELinux/AppArmor/run as another user/etc. ?

All other solutions have one of the following defects:

  * Are not shipped with all our target Linux distributions
    * (Fedora, Ubuntu, Debian, ArchLinux, Gentoo)
  * Lack features compared to firejail
  * Require superuser rights to launch a sandboxed application
  * Are hard to configure (and thus easy to mess up)
  * Lack support for things like:
    * [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/)
    * [AppImage](http://appimage.org/)

*GNU/Linux users love to argue and we love you for that, but trust us on this one,
we've [done the research](https://github.com/itchio/itch/issues/670). Maybe someday
a better solution than firejail will come and we'll consider switching then!*
