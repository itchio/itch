#!/usr/bin/env node

// pushes an updated itch PKGBUILD to AUR

const $ = require('./common')

$.say('Cloning repo...')
$($.sh('rm -rf aur-stage'))
$($.sh(`git clone ssh+git://aur@aur.archlinux.org/${$.app_name()}.git aur-stage`))

$($.sh(`cp release/templates/aur.itch.install aur-stage/${$.app_name()}.install`))

$.say('Generating PKGBUILD...')
const ver = $.build_version()
let rel = 1

try {
  // increment release number if versions match
  const opk = $.read_file('aur-stage/PKGBUILD')
  const oldver = /pkgver=(.+)/.exec(opk)[1]
  const oldrel = /pkgrel=(.+)/.exec(opk)[1]
  if (oldver === ver) {
    rel = parseInt(oldrel, 10) + 1
  }
} catch (err) {
  $.say(`Couldn't read old pkgbuild: ${err.toString()}`)
}

let pk = $.read_file('release/templates/PKGBUILD.in')
pk = pk.replace(/{{CI_APPNAME}}/g, $.app_name())
pk = pk.replace(/{{CI_VERSION}}/g, ver)
pk = pk.replace(/{{CI_SUFFIX}}/g, $.channel_name() === 'stable' ? '' : `-${$.channel_name()}`)
pk = pk.replace(/{{CI_CHANNEL}}/g, $.channel_name())
pk = pk.replace(/{{CI_REL}}/g, rel + '')

$.write_file('aur-stage/PKGBUILD', pk)

$.cd('aur-stage', function () {
  $.say('Updating checksums...')
  $($.sh('updpkgsums'))

  $.say('Validating PKGBUILD...')
  $($.sh('namcap -i PKGBUILD'))

  $.say('Updating pacman database...')
  $($.sh('sudo pacman -Sy'))

  $.say('Building package locally...')
  $($.sh('makepkg --syncdeps --force --needed --noconfirm'))

  $.say('Validating built package...')
  $($.sh(`namcap "${$.app_name()}-${ver}-${rel}-${$.get_output('uname -m').trim()}.pkg.tar.xz"`))

  $.say('Updating .SRCINFO...')
  $($.sh('makepkg --printsrcinfo > .SRCINFO'))

  $.say('Pushing to AUR...')
  $($.sh(`git add PKGBUILD .SRCINFO ${$.app_name()}.install`))
  $($.sh(`git commit -m ":arrow_up: ${$.build_tag()}"`))
  $($.sh('git push'))
})
