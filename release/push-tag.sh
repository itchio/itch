#!/bin/sh -xe

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Missing 'version'"
  exit 1
fi

PKG_VERSION=`grep "version" < package.json | cut -d '"' -f 4`
if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "Package version is $PKG_VERSION. Bump? (y/n)"
  read i
  if [ "$i" != "y" ]; then
    echo "Bailing out"
    exit 0
  fi
  sed -e 's/"version": .*$/"version": "$VERSION",/' -i "" package.json
  git add package.json
  git commit -m ":arrow_up: $VERSION"
fi

ADD_CMD="git tag -a $VERSION -m $VERSION"

if ($ADD_CMD); then
  echo "Tag added..."
else
  echo "Tag already exists locally. Replace? (y/n)"
  read i
  if [ "$i" != "y" ]; then
    echo "Bailing out"
    exit 0
  fi

  git tag -d $VERSION
  $ADD_CMD
fi

PUSH_CMD="git push origin $VERSION"
if ($PUSH_CMD); then
  echo "Tag added..."
else
  echo "Tag already exists on remote. Force-push? (y/n)"
  read i
  if [ "$i" != "y" ]; then
    echo "Bailing out"
    exit 0
  fi

  $PUSH_CMD -f
fi

git push

