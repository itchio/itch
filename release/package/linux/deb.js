
const $ = require('../../common')
const base = require('./base')

module.exports = {
  packageDeb: async function (arch, buildPath) {
    // APT package
    const debArch = $.toDebArch(arch)
    await $.showVersions(['fakeroot', 'ar'])

    $.say('Preparing stage2')
    const stage2Path = 'deb-stage'
    await base.prepareStage2(buildPath, stage2Path)
    $(await $.sh(`mkdir -p ${stage2Path}/DEBIAN`))
    $(await $.sh(`mkdir -p ${stage2Path}/usr/share/lintian/overrides`))

    $.say('Copying copyright')
    $(await $.sh(`cp "release/debian/copyright" "${stage2Path}/usr/share/doc/${$.appName()}"`))

    $.say('Copying lintian overrides')
    $(await $.sh(`cp "release/debian/lintian-overrides" "${stage2Path}/usr/share/lintian/overrides/${$.appName()}"`))

    $.say('Copying license')
    $(await $.sh(`rm "${stage2Path}/usr/lib/${$.appName()}/LICENSE"`))
    $(await $.sh(`mv "${stage2Path}/usr/lib/${$.appName()}/LICENSES.chromium.html" "${stage2Path}/usr/share/doc/${$.appName()}/LICENSE"`))

    $.say('Generating changelog...')
    let changelog = await $.readFile('release/debian/changelog.in')
    changelog = changelog.replace(/{{APPNAME}}/g, $.appName())
    changelog = changelog.replace(/{{VERSION}}/g, $.buildVersion())
    changelog = changelog.replace(/{{DATE}}/g, $.buildTime().toUTCString())
    await $.writeFile(`${stage2Path}/usr/share/doc/${$.appName()}/changelog`, changelog)

    $.say('Compressing man page & changelog')
    $(await $.sh(`gzip -f9 ${stage2Path}/usr/share/doc/${$.appName()}/changelog ${stage2Path}/usr/share/man/man6/${$.appName()}.6`))

    const duLines = (await $.getOutput(`du -ck ${stage2Path}`)).trim().split('\n')
    const totalLine = duLines[duLines.length - 1]
    const installedSize = parseInt(/^[0-9]+/.exec(totalLine), 10)

    $.say(`deb installed size: ${(installedSize / 1024).toFixed(2)} MB`)

    $.say('Generating control file...')

    // note: update dependencies from time to time
    const control = `
Package: ${$.appName()}
Version: ${$.buildVersion()}
Architecture: ${debArch}
Maintainer: ${$.MAINTAINER}
Installed-Size: ${Math.ceil(installedSize)}
Depends: gconf-service, libasound2 (>= 1.0.16), libatk1.0-0 (>= 1.12.4), libc6 (>= 2.12), libcairo2 (>= 1.6.0), libcups2 (>= 1.4.0), libdbus-1-3 (>= 1.2.14), libexpat1 (>= 2.0.1), libfontconfig1 (>= 2.9.0), libfreetype6 (>= 2.4.2), libgcc1 (>= 1:4.1.1), libgconf-2-4 (>= 2.31.1), libgdk-pixbuf2.0-0 (>= 2.22.0), libglib2.0-0 (>= 2.31.8), libgtk2.0-0 (>= 2.24.0), libnotify4 (>= 0.7.0), libnspr4 (>= 2:4.9-2~) | libnspr4-0d (>= 1.8.0.10), libnss3 (>= 2:3.13.4-2~) | libnss3-1d (>= 3.12.4), libpango-1.0-0 (>= 1.14.0), libpangocairo-1.0-0 (>= 1.14.0), libstdc++6 (>= 4.6), libx11-6 (>= 2:1.4.99.1), libxcomposite1 (>= 1:0.3-1), libxcursor1 (>> 1.1.2), libxdamage1 (>= 1:1.1), libxext6, libxfixes3, libxi6 (>= 2:1.2.99.4), libxrandr2 (>= 2:1.2.99.2), libxrender1, libxtst6, libappindicator1
Section: games
Priority: optional
Homepage: ${$.HOMEPAGE}
Description: install and play itch.io games easily
  The itch app lets you effortlessly download and run games and software
  from itch.io. All of your downloads are kept in a single place and are
  automatically updated. Access your collections and purchases, or browse
  for new games via the in-app browser. You can even sync any browser based
  games right into the app, letting you play them offline whenever you want.
  Once you're back online you'll be able to grab any updates if necessary.
  Thanks to the itch.io community, itch is available in over 20 languages!
`
    await $.writeFile(`${stage2Path}/DEBIAN/control`, control)

    await $.cd(stage2Path, async () => {
      let sums = ''

      for (const f of (await $.findAllFiles('usr/'))) {
        sums += `${$.md5(f)} ${f}\n`
      }
      await $.writeFile('DEBIAN/md5sums', sums)

      $.say('Fixing permissions...')
      for (const f of (await $.findAllFiles('.'))) {
        const stat = await $.lstat(f)
        const perms = stat.mode & 0o777
        switch (perms) {
          case 0o775:
            await $.chmod(0o755, f)
            break
          case 0o664:
            await $.chmod(0o644, f)
            break
        }
      }

      $.say('Compressing files...')
      await $.cd('DEBIAN', async () => {
        $(await $.sh('fakeroot tar cfz ../control.tar.gz .'))
      })

      $(await $.sh('mkdir data'))
      $(await $.sh('mv usr data/'))
      await $.cd('data', async () => {
        $(await $.sh('fakeroot tar cfJ ../data.tar.xz .'))
      })

      const deb = `../packages/${$.appName()}_${$.buildVersion()}_${debArch}.deb`
      $(await $.sh(`rm -f ${deb}`))
      await $.writeFile('debian-binary', '2.0\n')
      $(await $.sh(`ar cq ${deb} debian-binary control.tar.gz data.tar.xz`))
    })
  }
}
