#!/bin/sh -e
# build Debian package on non-Debian based systems
# requires: fakeroot, ar

export LANG=C
export LANGUAGE=C
export LC_ALL=C

cd "$(dirname "$0")/.."

if ! fakeroot --version 2>/dev/null >/dev/null ; then
  echo "fakeroot not in PATH!"
  exit 1
fi

version=$(grep '"version":' package.json | cut -d '"' -f4 | sed 's|-canary||')
if [ "$(uname -m)" = "x86_64" ]; then
  arch="amd64"
else
  arch="i386"
fi

CI_APPNAME=itch release/generate-itch-desktop.sh 2>/dev/null >/dev/null


echo "copy files"
rm -rf debian
mkdir -p debian/DEBIAN \
 debian/usr/games \
 debian/usr/lib \
 debian/usr/share/applications \
 debian/usr/share/doc/itch \
 debian/usr/share/lintian/overrides \
 debian/usr/share/man/man6

cp -r build/v*/itch-linux-*/ debian/usr/lib/itch
cp release/debian/copyright debian/usr/share/doc/itch
cp release/debian/lintian-overrides debian/usr/share/lintian/overrides/itch
cp release/itch.6 debian/usr/share/man/man6
cp release/itch.desktop debian/usr/share/applications
for size in 16 32 48 64 128 256 512 ; do
  mkdir -p debian/usr/share/icons/hicolor/${size}x${size}/apps
  cp release/itch-icons/icon${size}.png debian/usr/share/icons/hicolor/${size}x${size}/apps/itch.png
done

rm -f debian/usr/lib/itch/LICENSE
test ! -f debian/usr/lib/itch/LICENSES.chromium.html || \
  mv debian/usr/lib/itch/LICENSES.chromium.html debian/usr/share/doc/itch

sed "s|@VERSION@|$version|; s|@DATE@|$(date -R)|;" \
  release/debian/changelog.in > debian/usr/share/doc/itch/changelog

gzip -f9 debian/usr/share/doc/itch/changelog debian/usr/share/man/man6/itch.6
ln -fs ../lib/itch/itch debian/usr/games/itch


# note: update dependencies from time to time
installed_size=$(du -c debian | tail -n1 | awk '{print $1}')
cat <<EOF> debian/DEBIAN/control
Package: itch
Version: $version
Architecture: $arch
Maintainer: Amos Wenger <amos@itch.io>
Installed-Size: $installed_size
Depends: gconf-service, libasound2 (>= 1.0.16), libatk1.0-0 (>= 1.12.4), libc6 (>= 2.12), libcairo2 (>= 1.6.0), libcups2 (>= 1.4.0), libdbus-1-3 (>= 1.2.14), libexpat1 (>= 2.0.1), libfontconfig1 (>= 2.9.0), libfreetype6 (>= 2.4.2), libgcc1 (>= 1:4.1.1), libgconf-2-4 (>= 2.31.1), libgdk-pixbuf2.0-0 (>= 2.22.0), libglib2.0-0 (>= 2.31.8), libgtk2.0-0 (>= 2.24.0), libnotify4 (>= 0.7.0), libnspr4 (>= 2:4.9-2~) | libnspr4-0d (>= 1.8.0.10), libnss3 (>= 2:3.13.4-2~) | libnss3-1d (>= 3.12.4), libpango-1.0-0 (>= 1.14.0), libpangocairo-1.0-0 (>= 1.14.0), libstdc++6 (>= 4.6), libx11-6 (>= 2:1.4.99.1), libxcomposite1 (>= 1:0.3-1), libxcursor1 (>> 1.1.2), libxdamage1 (>= 1:1.1), libxext6, libxfixes3, libxi6 (>= 2:1.2.99.4), libxrandr2 (>= 2:1.2.99.2), libxrender1, libxtst6, p7zip-full
Section: games
Priority: optional
Homepage: https://itch.io
Description: install and play itch.io games easily
 The goal of this project is to give you a desktop application that you can
 download and run games from itch.io with. Additionally you should be able to
 update games and get notified when games are updated. The goal is not to
 replace the itch.io website.
EOF


echo "calculate checksums"
cd debian
find usr/* -type f -exec md5sum '{}' \; > DEBIAN/md5sums


# fix permissions
chmod a-x usr/lib/itch/*.so
find * -perm 0775 -exec chmod 0755 '{}' \;
find * -perm 0664 -exec chmod 0644 '{}' \;


echo "compress files"
cd DEBIAN && fakeroot tar cfz ../control.tar.gz .
cd ..
mkdir data && mv usr data
cd data && fakeroot tar cfJ ../data.tar.xz .
cd ..

deb="itch_${version}_${arch}.deb"
rm -f ../$deb
printf '2.0\n' > debian-binary
ar cq ../$deb debian-binary control.tar.gz data.tar.xz

cd ..
rm -rf debian

