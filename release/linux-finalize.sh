#!/bin/sh -xe
# generate .deb and .rpm packages

gem install dpl
CI_RELEASE_DATE="`date +%Y-%m-%d`"
FPM_VERSION=$CI_VERSION

if [ "$CI_ARCH" = "386" ]; then
  FPM_ARCH="i386"
else
  FPM_ARCH="x86_64"
fi

FPM_NAME="$CI_APPNAME"
FPM_DESCRIPTION="The best way to play itch.io games"
FPM_URL="https://github.com/itchio/$CI_APPNAME"
FPM_MAINTAINER="Amos Wenger <amos@itch.io>"
FPM_LICENSE="MIT"
FPM_VENDOR="itch.io"
FPM_CATEGORY="games"
FPM_AFTER_INSTALL="$CI_PROJECT_DIR/release/debian-after-install.sh"
rm -rf stage2 && mkdir -p stage2/$CI_APPNAME
cp -rf $BUILD_PATH/* stage2/$CI_APPNAME

if [ -n "`gem list | grep fpm-itchio`" ]; then
  gem uninstall fpm-itchio
fi

if [ -z "`gem list | grep fpm`" ]; then
  gem install fpm -v "~> 1.5.0"
fi

release/generate-itch-desktop.sh

cat release/$CI_APPNAME.desktop
DISTRO_FILES="$CI_APPNAME=/opt \
  ../release/$CI_APPNAME.sh=/usr/bin/$CI_APPNAME \
  ../release/$CI_APPNAME.desktop=/usr/share/applications/$CI_APPNAME.desktop \
  ../release/$CI_APPNAME-icons/icon16.png=/usr/share/icons/hicolor/16x16/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon32.png=/usr/share/icons/hicolor/32x32/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon36.png=/usr/share/icons/hicolor/36x36/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon48.png=/usr/share/icons/hicolor/48x48/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon64.png=/usr/share/icons/hicolor/64x64/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon72.png=/usr/share/icons/hicolor/72x72/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon144.png=/usr/share/icons/hicolor/144x144/apps/$CI_APPNAME.png \
  ../release/$CI_APPNAME-icons/icon512.png=/usr/share/icons/hicolor/512x512/apps/$CI_APPNAME.png"

# Build deb package
fpm --force \
  -C stage2 -s dir -t deb \
  --deb-compression xz \
  --name "$FPM_NAME" \
  --description "$FPM_DESCRIPTION" \
  --url "$FPM_URL" \
  --version "$FPM_VERSION" \
  --maintainer "$FPM_MAINTAINER" \
  --architecture "$FPM_ARCH" \
  --license "$FPM_LICENSE" \
  --vendor "$FPM_VENDOR" \
  --category "$FPM_CATEGORY" \
  --after-install "$FPM_AFTER_INSTALL" \
  -d "p7zip-full (> 0)" \
  -d "desktop-file-utils (> 0)" \
  $DISTRO_FILES

# Build rpm package
fpm --force \
  -C stage2 -s dir -t rpm \
  --rpm-compression xz \
  --name "$FPM_NAME" \
  --description "$FPM_DESCRIPTION" \
  --url "$FPM_URL" \
  --version "$FPM_VERSION" \
  --maintainer "$FPM_MAINTAINER" \
  --architecture "$FPM_ARCH" \
  --license "$FPM_LICENSE" \
  --vendor "$FPM_VENDOR" \
  --category "$FPM_CATEGORY" \
  --after-install "$FPM_AFTER_INSTALL" \
  -d "p7zip" \
  -d "desktop-file-utils" \
  $DISTRO_FILES

mv *.deb *.rpm build/
