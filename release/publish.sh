#!/bin/sh -xe

if [ "$CI_ARCH" = "386" ]; then
  ELECTRON_ARCH="ia32"
else
  ELECTRON_ARCH="x64"
fi

BUILD_PATH="build/$JENKINS_TAG/itch-$CI_OS-$ELECTRON_ARCH"

release/prepare.sh

TASKS="electron:$CI_OS-$ELECTRON_ARCH"

if [ "$CI_OS" = "windows" ]; then
  export CI_WINDOWS_INSTALLER_PATH="/c/jenkins/workspace/itch-installers/$CI_CHANNEL"
  mkdir -p ${CI_WINDOWS_INSTALLER_PATH}
  TASKS="$TASKS create-windows-installer:$ELECTRON_ARCH"
fi

if [ "$CI_OS" = "windows" ]; then
  UPLOADS="$UPLOADS $(echo ${CI_WINDOWS_INSTALLER_PATH}/itch-${JENKINS_VERSION}*.nupkg ${CI_WINDOWS_INSTALLER_PATH}/*.exe ${CI_WINDOWS_INSTALLER_PATH}/RELEASES)"
fi

if [ "$CI_OS" = "darwin" ]; then
  OSX_SIGN_KEY="Developer ID Application: Amos Wenger (B2N6FSRTPV)"
  ditto -v $BUILD_PATH/itch.app itch.app
  codesign --deep --force --verbose --sign "$OSX_SIGN_KEY" itch.app
  codesign --verify -vvvv itch.app
  spctl -a -vvvv itch.app
  7za a itch-mac.zip itch.app
  npm install -g appdmg
  appdmg release/appdmg.json itch-mac.dmg
  UPLOADS="$UPLOADS itch-mac.zip itch-mac.dmg"
fi

if [ "$CI_OS" = "linux" ]; then
  gem install dpl
  JENKINS_RELEASE_DATE="$(date +%Y-%m-%d)"
  FPM_VERSION=$JENKINS_VERSION
  if [ "$JENKINS_ARCH" = "386" ]; then
    FPM_ARCH="i386"
  else
    FPM_ARCH="x86_64"
  fi
  FPM_NAME="itch"
  FPM_DESCRIPTION="The best way to play itch.io games"
  FPM_URL="https://github.com/itchio/itch"
  FPM_MAINTAINER="Amos Wenger <amos@itch.io>"
  FPM_LICENSE="MIT"
  FPM_VENDOR="itch.io"
  FPM_CATEGORY="games"
  FPM_AFTER_INSTALL="$WORKSPACE/release/debian-after-install.sh"
  rm -rf stage2 && mkdir -p stage2/itch
  cp -rf $BUILD_PATH/* stage2/itch
  gem uninstall fpm -x
  gem install fpm-itchio
  release/generate-itch-desktop.sh
  cat release/itch.desktop
  DISTRO_FILES="itch=/opt \
    ../release/itch.sh=/usr/bin/itch \
    ../release/itch.desktop=/usr/share/applications/itch.desktop \
    ../release/icons/icon16.png=/usr/share/icons/hicolor/16x16/apps/itch.png \
    ../release/icons/icon32.png=/usr/share/icons/hicolor/32x32/apps/itch.png \
    ../release/icons/icon36.png=/usr/share/icons/hicolor/36x36/apps/itch.png \
    ../release/icons/icon48.png=/usr/share/icons/hicolor/48x48/apps/itch.png \
    ../release/icons/icon64.png=/usr/share/icons/hicolor/64x64/apps/itch.png \
    ../release/icons/icon72.png=/usr/share/icons/hicolor/72x72/apps/itch.png \
    ../release/icons/icon144.png=/usr/share/icons/hicolor/144x144/apps/itch.png \
    ../release/icons/icon512.png=/usr/share/icons/hicolor/512x512/apps/itch.png"
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

  UPLOADS="$UPLOADS $(echo build/*.deb build/*.rpm)"
  if [ "$CI_ARCH" = "386" ]; then
    DEB_ARCH="i386"
  else
    DEB_ARCH="amd64"
  fi

  for repo in rpm deb; do
    echo "Uploading to $repo repo"
    rm -f bintray.json
    sed \
      -e "s/{{JENKINS_VERSION}}/${JENKINS_VERSION}/g" \
      -e "s/{{JENKINS_RELEASE_DATE}}/${JENKINS_RELEASE_DATE}/g" \
      -e "s/{{DEB_ARCH}}/${DEB_ARCH}/" \
      < release/bintray.${repo}.json \
      > bintray.json
    cat bintray.json
    set +x
    dpl --provider=bintray \
      --file=bintray.json \
      --user=fasterthanlime \
      --key="$BINTRAY_TOKEN"
    set -x
  done
fi

# Let lord GitHub not be 502'ing, and I will upload one more time - the Devops bible
for f in $(echo $UPLOADS); do
  success=""
  for i in 1 2 3 4 5; do
    github-release upload \
            --tag "$JENKINS_TAG" \
            --name "$(basename $f)" \
            --file "$f" \
            --replace \
            && success="yay"
    if [ "$success" = "yay" ]; then
      break
    else
      echo "Retrying upload of $f (try $i)"
      sleep 30
    fi
  done
  if [ "$success" != "yay" ]; then
    echo "Could not upload $f, despite our best efforts. Bailing out."
    exit 1
  fi
done
