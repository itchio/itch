#!/bin/sh -xe
# upload assets to github release using https://github.com/itchio/github-release
# fails stupidly often, hence the retry logic - you'd be surprised how
# many times that 5*30 delay allowed me to delete the asset manually.

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
