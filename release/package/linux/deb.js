
const $ = require('../../common')
const base = require('./base')

module.exports = {
  package_deb: function (arch, build_path) {
    // APT package
    const deb_arch = $.to_deb_arch(arch)
    $.show_versions(['fakeroot', 'ar'])

    $.say('Preparing stage2')
    const stage2_path = 'deb-stage'
    base.prepare_stage2(build_path, stage2_path)
    $($.sh(`mkdir -p ${stage2_path}/DEBIAN`))
    $($.sh(`mkdir -p ${stage2_path}/usr/share/lintian/overrides`))

    $.say('Copying copyright')
    $($.sh(`cp "release/debian/copyright" "${stage2_path}/usr/share/doc/${$.app_name()}"`))

    $.say('Copying lintian overrides')
    $($.sh(`cp "release/debian/lintian-overrides" "${stage2_path}/usr/share/lintian/overrides/${$.app_name()}"`))

    $.say('Copying license')
    $($.sh(`rm "${stage2_path}/usr/lib/${$.app_name()}/LICENSE"`))
    $($.sh(`mv "${stage2_path}/usr/lib/${$.app_name()}/LICENSES.chromium.html" "${stage2_path}/usr/share/doc/${$.app_name()}/LICENSE"`))

    $.say('Generating changelog...')
    let changelog = $.read_file('release/debian/changelog.in')
    changelog = changelog.replace(/{{APPNAME}}/g, $.app_name())
    changelog = changelog.replace(/{{VERSION}}/g, $.build_version())
    changelog = changelog.replace(/{{DATE}}/g, $.build_time().toUTCString())
    $.write_file(`${stage2_path}/usr/share/doc/${$.app_name()}/changelog`, changelog)

    $.say('Compressing man page & changelog')
    $($.sh(`gzip -f9 ${stage2_path}/usr/share/doc/${$.app_name()}/changelog ${stage2_path}/usr/share/man/man6/${$.app_name()}.6`))

    const du_lines = $.get_output(`du -ck ${stage2_path}`).trim().split('\n')
    const total_line = du_lines[du_lines.length - 1]
    const installed_size = parseInt(/^[0-9]+/.exec(total_line))

    $.say(`deb installed size: ${(installed_size / 1024).toFixed(2)} MB`)

    $.say('Generating control file...')

    // note: update dependencies from time to time
    const control = `
Package: ${$.app_name()}
Version: ${$.build_version()}
Architecture: ${deb_arch}
Maintainer: ${$.MAINTAINER}
Installed-Size: ${Math.ceil(installed_size)}
Depends: gconf-service, libasound2 (>= 1.0.16), libatk1.0-0 (>= 1.12.4), libc6 (>= 2.12), libcairo2 (>= 1.6.0), libcups2 (>= 1.4.0), libdbus-1-3 (>= 1.2.14), libexpat1 (>= 2.0.1), libfontconfig1 (>= 2.9.0), libfreetype6 (>= 2.4.2), libgcc1 (>= 1:4.1.1), libgconf-2-4 (>= 2.31.1), libgdk-pixbuf2.0-0 (>= 2.22.0), libglib2.0-0 (>= 2.31.8), libgtk2.0-0 (>= 2.24.0), libnotify4 (>= 0.7.0), libnspr4 (>= 2:4.9-2~) | libnspr4-0d (>= 1.8.0.10), libnss3 (>= 2:3.13.4-2~) | libnss3-1d (>= 3.12.4), libpango-1.0-0 (>= 1.14.0), libpangocairo-1.0-0 (>= 1.14.0), libstdc++6 (>= 4.6), libx11-6 (>= 2:1.4.99.1), libxcomposite1 (>= 1:0.3-1), libxcursor1 (>> 1.1.2), libxdamage1 (>= 1:1.1), libxext6, libxfixes3, libxi6 (>= 2:1.2.99.4), libxrandr2 (>= 2:1.2.99.2), libxrender1, libxtst6, p7zip-full, libappindicator1
Section: games
Priority: optional
Homepage: ${$.HOMEPAGE}
XB-AppName: ${$.app_name()}
XB-Icon: ${$.app_name()}.png
XB-Screenshot-Url: https://cloud.githubusercontent.com/assets/7998310/16583085/7702c448-42b3-11e6-949a-c5b45e906807.png
XB-Thumbnail-Url: https://cloud.githubusercontent.com/assets/7998310/17108609/91a94128-5294-11e6-8b27-1ef896bdeb4e.png
XB-Category: Game
Description: install and play itch.io games easily
  The goal of this project is to give you a desktop application that you can
  download and run games from itch.io with. Additionally you should be able to
  update games and get notified when games are updated. The goal is not to
  replace the itch.io website.
`
    $.write_file(`${stage2_path}/DEBIAN/control`, control)

    $.cd(stage2_path, function () {
      let sums = ''
      $.find_all_files('usr/').forEach(function (f) {
        sums += `${$.md5(f)} ${f}\n`
      })
      $.write_file('DEBIAN/md5sums', sums)

      $.say('Fixing permissions...')
      $.find_all_files('.').forEach(function (f) {
        const stat = $.lstat(f)
        const perms = stat.mode & 0o777
        switch (perms) {
          case 0o775:
            $.chmod(0o755, f)
            break
          case 0o664:
            $.chmod(0o644, f)
            break
        }
      })

      $.say('Compressing files...')
      $.cd('DEBIAN', function () {
        $($.sh('fakeroot tar cfz ../control.tar.gz .'))
      })

      $($.sh('mkdir data'))
      $($.sh('mv usr data/'))
      $.cd('data', function () {
        $($.sh('fakeroot tar cfJ ../data.tar.xz .'))
      })

      const deb = `../packages/${$.app_name()}_${$.build_version()}_${deb_arch}.deb`
      $($.sh(`rm -f ${deb}`))
      $.write_file('debian-binary', '2.0\n')
      $($.sh(`ar cq ${deb} debian-binary control.tar.gz data.tar.xz`))
    })
  }
}
