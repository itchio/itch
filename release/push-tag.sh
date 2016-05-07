#!/bin/sh -e
# TODO: replace with ruby/python version at some point - anything but shell
# enter a version like vX.Y.Z-canary to release a canary build, enter
# vX.Y.Z to release a stable build. pushing tags trigger builds.
# FIXME: git-mirrors doesn't seem to react on pushing tags without
# new objects (commits).

PKG_VERSION=`grep "version" < package.json | cut -d '"' -f 4`
echo "Package version is: $PKG_VERSION, type yours"

read VERSION
if [ -z "$VERSION" ]; then
  echo "Missing 'version'"
  exit 1
fi

VLESS_VERSION=`echo $VERSION | sed 's/^v//'`
if [ "$VLESS_VERSION" = "$VERSION" ]; then
  echo "Version must start with 'v'!"
  exit 1
fi

PKG_VERSION=`grep "version" < package.json | cut -d '"' -f 4`
if [ "$VLESS_VERSION" != "$PKG_VERSION" ]; then
  echo "Package version is $PKG_VERSION. Bump? (y/n)"
  read i
  if [ "$i" != "y" ]; then
    echo "Bailing out"
    exit 0
  fi
  sed -e "s/\"version\": .*$/\"version\": \"$VLESS_VERSION\",/" -i "" package.json
  git add package.json
  git commit -m ":arrow_up: $VLESS_VERSION"
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
