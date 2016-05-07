#!/bin/sh -xe
# send notification to @fasterthanlime's phone when a new version is up.
# let him know if you want to get added to the recipients list or if you
# have a better idea than buying a $4 android app for that :)

curl -s \
  --form-string "token=$PUSHOVER_API_TOKEN" \
  --form-string "user=$PUSHOVER_USER_TOKEN" \
  --form-string "message=itch $CI_BUILD_TAG deployed, QA time!" \
  https://api.pushover.net/1/messages.json
