#!/bin/bash
# print a list of unused i18n strings, and missing i18n strings

EN_FILE="appsrc/static/locales/en.json"
USED=`ag -G "tsx?$" --nocolor --nofilename -o "[^a-zA-Z]t\(\"([a-z_\.]+\")\)" | grep -v '^$' | sed 's/.t("\(.*\)")/\\1/'`
ALL_DEFINED=1

for string in $USED; do
  grep -F "$string" < $EN_FILE > /dev/null
  if [ "$?" != "0" ]; then
    echo "Missing string: $string"
    ALL_DEFINED=0
  fi
done

if [[ "$ALL_DEFINED" = "1" ]]; then
  echo "All used strings are in en.json"
else
  echo "Found some undefined strings"
  exit 1
fi

LISTED=`grep '"\(.*\)": ' -o < $EN_FILE | sed 's/"\(.*\)":/\1/'`
ALL_USED=1

for string in $LISTED; do
  ag $TYPES -F "$string" . > /dev/null
  if [ "$?" != "0" ]; then
    echo "Unused string: $string"
    ALL_USED=0
  fi
done

if [[ "$ALL_USED" = "1" ]]; then
  echo "All en.json strings are used"
else
  echo "Found some unused strings"
  exit 1
fi
