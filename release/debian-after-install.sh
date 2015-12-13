#!/bin/sh
set -e

case $1 in
  configure|remove) update-desktop-database ;;
esac
