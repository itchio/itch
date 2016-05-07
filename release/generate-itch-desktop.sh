#!/bin/sh -xe
# generate localized desktop file from desktop.in and locales file
# are grep/cut the wrong tools for parsing JSON? absolutely!

DST=release/${CI_APPNAME}.desktop
cat release/${CI_APPNAME}.desktop.in > $DST

for LOCALE_FILE in app/static/locales/*.json; do
  LOCALE=$(basename $LOCALE_FILE | sed 's/.json$//')
  STRING=$(grep "desktop.shortcut.comment" < $LOCALE_FILE | cut -d '"' -f 4)
  if [ -n "$STRING" ]; then
    echo "Comment[$LOCALE]=\"$STRING\"" >> $DST
  fi
done
