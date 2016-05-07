#!/bin/sh -xe
# sign osx binary using @fasterthanlime's certificate and generate dmg

OSX_SIGN_KEY="Developer ID Application: Amos Wenger (B2N6FSRTPV)"

# sign
ditto -v $BUILD_PATH/$CI_APPNAME.app $CI_APPNAME.app
codesign --deep --force --verbose --sign "$OSX_SIGN_KEY" $CI_APPNAME.app
codesign --verify -vvvv $CI_APPNAME.app
spctl -a -vvvv $CI_APPNAME.app

# compress
7za a $CI_APPNAME-mac.zip $CI_APPNAME.app

if (which appdmg); then
  echo "Already have appdmg"
else
  $NPM_CMD install -g appdmg
fi

# build dmg
appdmg release/appdmg-$CI_APPNAME.json $CI_APPNAME-mac.dmg
