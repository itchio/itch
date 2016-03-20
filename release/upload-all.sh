#!/bin/sh -xe

# Let lord GitHub not be 502'ing, and I will upload one more time - the Devops bible
for f in $(echo $UPLOADS); do
  success=""
  for i in 1 2 3 4 5; do
    github-release upload \
            --tag "$CI_BUILD_TAG" \
            --name "$(basename $f)" \
            --file "$f" \
            --replace \
            && success="yay"
    if [ "$success" = "yay" ]; then
      break
    else
      echo "Retrying upload of $f (try $i)"
      sleep 30
    fi
  done
  if [ "$success" != "yay" ]; then
    echo "Could not upload $f, despite our best efforts. Bailing out."
    exit 1
  fi
done
