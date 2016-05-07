#!/bin/sh -xe
# build and upload packages to github/bintray/etc.

if [ "$CI_ARCH" = "386" ]; then
  ELECTRON_ARCH="ia32"
else
  ELECTRON_ARCH="x64"
fi

export BUILD_PATH="build/$CI_BUILD_TAG/$CI_APPNAME-$CI_OS-$ELECTRON_ARCH"

release/prepare.sh

TASKS="electron:$CI_OS-$ELECTRON_ARCH"

if [ "$CI_OS" = "windows" ]; then
  export CI_WINDOWS_INSTALLER_PATH="/c/jenkins/workspace/$CI_APPNAME-installers/"
  mkdir -p ${CI_WINDOWS_INSTALLER_PATH}
  TASKS="$TASKS create-windows-installer:$ELECTRON_ARCH"
fi

grunt -v $TASKS

if [ "$CI_OS" = "windows" ]; then
  UPLOADS="$UPLOADS $(echo ${CI_WINDOWS_INSTALLER_PATH}/$CI_APPNAME-${CI_VERSION}*.nupkg ${CI_WINDOWS_INSTALLER_PATH}/*.exe ${CI_WINDOWS_INSTALLER_PATH}/RELEASES)"
fi

if [ "$CI_OS" = "darwin" ]; then
  release/osx-finalize.sh
  UPLOADS="$UPLOADS $CI_APPNAME-mac.zip $CI_APPNAME-mac.dmg"
fi

if [ "$CI_OS" = "linux" ]; then
  release/linux-finalize.sh

  CI_PUBLISH="false"
  if [ "$CI_CHANNEL" = "canary" ]; then
    CI_PUBLISH="true"
  fi

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
      -e "s/{{CI_APPNAME}}/${CI_APPNAME}/g" \
      -e "s/{{CI_VERSION}}/${CI_VERSION}/g" \
      -e "s/{{CI_RELEASE_DATE}}/${CI_RELEASE_DATE}/g" \
      -e "s/{{CI_PUBLISH}}/${CI_PUBLISH}/g" \
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

export UPLOADS
release/upload-all.sh
