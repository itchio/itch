
# Building Linux software into a prefix

If, instead of using a pre-made Game engine package like Unity, you prefer
picking a few libraries here and there and mix them in your own way, you might
reach a point where you want to build your own versions of those libraries,
so that you may bundle them with your game.

*See the [Distributing Linux builds][linux-dist] page of this book*

[linux-dist]: ../integrating/platforms/linux.md

## autotools (./configure && make)

The most common form under which open-source software is distributed is probably
using autotools.

Their idea of a build process is in three steps:

```bash
# gather information about the system, paths, dependencies
$ ./configure

# compile and link binary objects
$ make

# copy production files to the prefix
$ sudo make install
```

The default prefix is usually `/usr`, or `/usr/local`, which means:

  * Binaries are installed in `/usr/bin/` (or `/usr/local/bin`)
  * Libraries are installed in `/usr/lib/`
  * Data files are installed in `/usr/share`
  * ...and so on

The only reason `sudo` is required for the install step is because the default
prefix is a system-wide directory that can only be written to by privileged users
(like root).

However, you can simply specify your own prefix, so that the built library is
installed into an unprivileged, user-owned directory, ready for bundling with
your games.

With autotools, you can specify the prefix in the configure phase, with the
`--prefix` flag:

```bash
$ ./configure --prefix=$HOME/myprefix/sdl2

# and then, make && make install, as usual
```

*Note: `--prefix` usually has to be an absolute path.*

Building each library in its own prefix is a good habit: it makes it immediately
cleary which files belong to which library.

For the purpose of [bundling your libraries][linux-dist], in this example, one
would copy all files in `$HOME/myprefix/sdl2/lib/` to their bundled library folder.

## CMake

*This section assumes that you have read the `autotools` section above, which
contains some fundamentals about prefixes and how software is built on Linux.*

The usual CMake build process goes like this:

```
$ cmake .
$ make
$ make install
```

You can specify the installation prefix by setting the [`CMAKE_INSTALL_PREFIX`][cmake-install-prefix]
variable:

[cmake-install-prefix]: https://cmake.org/cmake/help/v3.0/variable/CMAKE_INSTALL_PREFIX.html

```
$ cmake . -DCMAKE_INSTALL_PREFIX=$HOME/myprefix/chipmunk2d
```

## Appendix to the appendix 1: Why build your own software?

There are many good reasons to build your own software. First of all, because
running someone else's binary is a security risk — it can get very hard  to tell
what a binary is going to actually do just by looking at it, and monitoring it
isn't entirely failsafe either.

In an ideal world, everybody would:

  * Read the entire source code of all the software they use
  * Compile their own version of it

*Note: this would assume they're also able to read and comprehend their compiler's
source code, to prevent attacks like the [Ken Thompson Hack (1984)][kth]*

[kth]: http://programmers.stackexchange.com/questions/184874/is-ken-thompsons-compiler-hack-still-a-threat

Since most people have barely enough patience to learn how to properly use
well-packaged software, this is impractical, so what the world does instead is
download packaged software from sources they trust, like their Linux distribution
official repositories.

This is part of the reason why maintaining a Linux distribution is so much work:
package maintainers have to work around the clock to maintain a strict set of
rules, audit packages for potential security problems, and apply both security
and compatibility patches in a timely manner.

As a result, some packaged versions of certain software ends up diverging
significantly from the original (`upstream`) version, for example because of
the security policy of a certain Linux distribution, or its filesystem hierarchy,
that differs slightly from the expectations of the software's author.

For these reasons, copying libraries straight out of `/usr/lib` and into your
game's bundle is not always the best of ideas, since they may rely on a particular
behavior that other distributions do not adhere to.

There is another compelling reason to build your own version of software: on
occasion, you may find a bug in the libraries you use. Sometimes, with a little
luck and lot of persistence, you'll find what causes it before the maintainer,
you might even have a *works-for-me* solution that you really need to ship your
game, but the maintainer doesn't want to merge right now (for valid reasons).

If you build your own libraries, you can simply make and distribute the change
yourself, not having to wait for the maintainer and packagers to catch up with
you. This flexibility doesn't exist in the closed-source, 'all-in-one' world.

## Appendix to the appendix 2: Out-of-tree builds

Both autotools and CMake allow (when configured correctly) out-of-tree builds.
What does that mean? When building, we have three kinds of assets:

  * Source files (downloaded and unpacked)
  * Temporary files (binary objects, etc. not yet linked or stripped)
  * Distribution files (executables, libraries)

When running the `./configure && make && make install` steps every other guide
recommends, source files and temporary files live in the same folder. Temporary
files can sometimes be removed with `make clean`, `make distclean` or `make mrproper`,
but not always.

The cleanest way to separate those is to build libraries in a separate directory,
like so:

```
$ mkdir my-library-build
$ ls
my-library-source
my-library-build

$ cd my-library-build
$ ../my-library-source/configure --prefix=$HOME/myprefix/my-library
$ make
$ make install
```

With this method, the `my-library-source` folder isn't touched at all.

CMake allows doing the same:

```
$ mkdir my-library-build
$ ls
my-library-source
my-library-build

$ cd my-library-build
$ cmake ../my-library-source -DCMAKE_INSTALL_PREFIX=$HOME/myprefix/my-library
$ make
$ make install
```

*Caveat: like every setting ever, some libraries will sometimes support one but
not the other, or the other way around. Some autotools-based libraries will
assume  you're building in-tree and will fail to find some files otherwise,
whereas some CMake-based libraries will require you to  do an out-of-tree build
to prevent overwriting files.*

*Like every situation ever, the correct course of action is to apply patience
and forgiveness, because software is hard.*
