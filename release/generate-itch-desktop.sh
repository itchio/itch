#!/bin/sh
SCRIPTPATH=$( cd $( dirname -- "$0" ) > /dev/null ; pwd )

DST=${SCRIPTPATH}/${CI_APPNAME}.desktop
cat ${SCRIPTPATH}/${CI_APPNAME}.desktop.in > $DST

for LOCALE_FILE in ${SCRIPTPATH}/../app/static/locales/*.json; do
  LOCALE=$(basename $LOCALE_FILE | sed 's/.json$//')
  STRING=$(grep "desktop.shortcut.comment" < $LOCALE_FILE | cut -d '"' -f 4)
  if [ -n "$STRING" ]; then
    echo "Comment[$LOCALE]=\"$STRING\"" >> $DST
  fi
done
