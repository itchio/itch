#!/usr/bin/env node

// pushes an updated itch PKGBUILD to AUR

const $ = require('./common')

async function ciPackageAur() {
  delete process.env.BUTLER_ENABLE

  $.say('Cloning repo...')
  $(await $.sh('rm -rf aur-stage'))
  $(await $.sh(`git clone ssh+git://aur@aur.archlinux.org/${$.appName()}.git aur-stage`))

  $(await $.sh(`cp release/templates/aur.itch.install aur-stage/${$.appName()}.install`))

  $.say('Generating PKGBUILD...')
  const ver = $.buildVersion()
  let rel = 1

  try {
    // increment release number if versions match
    const opk = await $.readFile('aur-stage/PKGBUILD')
    const oldver = /pkgver=(.+)/.exec(opk)[1]
    const oldrel = /pkgrel=(.+)/.exec(opk)[1]
    if (oldver === ver) {
      rel = parseInt(oldrel, 10) + 1
    }
  } catch (err) {
    $.say(`Couldn't read old pkgbuild: ${err.toString()}`)
  }

  let pk = await $.readFile('release/templates/PKGBUILD.in')
  pk = pk.replace(/{{CI_APPNAME}}/g, $.appName())
  pk = pk.replace(/{{CI_VERSION}}/g, ver)
  pk = pk.replace(/{{CI_SUFFIX}}/g, $.channelName() === 'stable' ? '' : `-${$.channelName()}`)
  pk = pk.replace(/{{CI_CHANNEL}}/g, $.channelName())
  pk = pk.replace(/{{CI_REL}}/g, rel + '')

  await $.writeFile('aur-stage/PKGBUILD', pk)

  await $.cd('aur-stage', async () => {
    $.say('Updating checksums...')
    $(await $.sh('updpkgsums'))

    $.say('Validating PKGBUILD...')
    $(await $.sh('namcap -i PKGBUILD'))

    $.say('Updating pacman database...')
    $(await $.sh('sudo pacman -Sy'))

    $.say('Building package locally...')
    $(await $.sh('makepkg --syncdeps --force --needed --noconfirm'))

    $.say('Validating built package...')
    const unameM = await $.getOutput('uname -m').trim();
    $(await $.sh(`namcap "${$.appName()}-${ver}-${rel}-${unameM}.pkg.tar.xz"`))

    $.say('Updating .SRCINFO...')
    $(await $.sh('mksrcinfo'))

    $.say('Pushing to AUR...')
    $(await $.sh(`git add PKGBUILD .SRCINFO ${$.appName()}.install`))
    $(await $.sh(`git commit -m ":arrow_up: ${$.buildTag()}"`))
    $(await $.sh('git push'))
  })
}

ciPackageAur()
