#!/bin/sh -xe

curl -s \
  --form-string "token=$PUSHOVER_API_TOKEN" \
  --form-string "user=$PUSHOVER_USER_TOKEN" \
  --form-string "message=itch $CI_BUILD_TAG deployed, QA time!" \
  https://api.pushover.net/1/messages.json
