#!/bin/sh -e

export LANG=C
export LANGUAGE=C
export LC_ALL=C

log="debian.log"
cd "$(dirname "$0")/.."


# download additional sources and tools
deps="git wget"

# packaging tools
deps="$deps build-essential debhelper fakeroot"

# package lint
deps="$deps lintian"

# required to build sassc
deps="$deps autoconf automake autopoint libtool"

# required to automatically resolve dependencies;
# most of these should be installed by default anyway
deps="$deps libasound2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
libfreetype6 libgconf-2-4 libgtk2.0-0 libnotify4 libnspr4 libnss3 \
libx11-6 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
libxi6 libxrandr2 libxrender1 libxtst6"

# check build-dependencies
echo "checking dependencies:"
for d in $deps ; do
  printf "  $d - "
  if [ $(dpkg-query -W -f='${Status}' $d 2>/dev/null | grep -c "ok installed") -eq 0 ]; then
    missing="$missing $d"
    echo "missing"
  else
    echo "ok"
  fi
done
if [ "x$(echo "$missing" | tr -d ' ')" != "x" ]; then
  echo "You need to install the following package(s):"
  echo "$missing"
  sudo -k apt-get -q install $missing
fi


node_arch=x86
if [ "$(dpkg-architecture -qDEB_HOST_ARCH)" = "amd64" ]; then
  node_arch=x64
fi

version=$(grep '"version":' package.json | cut -d '"' -f4 | sed 's|-canary||')
grunt_dev=$(wget -q -O- https://raw.githubusercontent.com/gruntjs/grunt/master/package.json | grep '"version":' | cut -d '"' -f4)
#node_bin=$(wget -q -O- https://nodejs.org/dist/latest/SHASUMS256.txt | grep -e "node-.*-linux-${node_arch}.tar.xz" | awk '{print $2}')
node_bin="node-v5.9.1-linux-${node_arch}.tar.xz"

rm -rf debian node_modules sassc node.tar.xz

cp -r release/debian .
sed "s|@VERSION@|$version|; s|@DATE@|$(date -R)|;" debian/changelog.in > debian/changelog

# sassc is not available on all distributions
git clone --depth 1 "https://github.com/sass/sassc.git" sassc
git clone --depth 1 "https://github.com/sass/libsass.git" sassc/libsass

# download precompiled nodejs+npm to avoid possible incompatibilities
wget -O node.tar.xz "https://nodejs.org/dist/v5.9.1/$node_bin"
#wget -O node.tar.xz "https://nodejs.org/dist/latest/$node_bin"

echo $node_bin | sed 's|\.tar\.xz||' > debian/NODE-RELEASE
tar xf node.tar.xz

export PATH="$PWD/`cat debian/NODE-RELEASE`/bin:$PATH"
npm cache clean  # http://stackoverflow.com/a/15483897/5687704
npm set tmp /tmp
npm install
npm install grunt@$grunt_dev


dpkg-buildpackage -rfakeroot -b -us -uc 2>&1 | tee $log

packages="$(find .. -maxdepth 1 -type f -name itch*.deb)"
if [ "x$packages" != "x" ]; then
  for f in $packages ; do
    echo "$f:"
    dpkg-deb -I $f
    echo ""
  done 2>&1 | tee -a $log
  for f in $packages ; do
    echo "$f:"
    dpkg-deb -c $f
    echo ""
  done 2>&1 | tee -a $log
  for f in $packages ; do
    echo "Lintian tags for $f:"
    lintian $f
    echo ""
  done 2>&1 | tee -a $log
fi

# packages are always saved in the upper directory;
# right now I don't know how or if this can be changed
echo ""
echo "Debian package saved to \`$(dirname "$PWD")'"
echo ""

