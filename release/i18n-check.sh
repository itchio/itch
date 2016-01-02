#!/bin/bash

EN_FILE="app/static/locales/en.json"
USED=`ag --nocolor --nofilename -o "[^a-z]t\(\'([a-z_\.]+\')\)" | grep -v '^$' | sed "s/.t('\(.*\)')/\\1/"`

for string in $USED; do
  grep -F "$string" < $EN_FILE > /dev/null || (echo "Missing string: $string" && exit 1)
done

echo "All good!"
