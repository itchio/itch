#!/bin/sh
set -e

case $1 in
  configure|remove)
        update-desktop-database
        xdg-mime default itch.desktop x-scheme-handler/itchio
         ;;
esac
