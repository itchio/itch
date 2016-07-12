
const $ = require('../../common')
const base = require('./base')

module.exports = {
  package_rpm: function (arch, build_path) {
    // RPM package
    const rpm_arch = $.to_rpm_arch(arch)
    $($.gem_dep('fpm', 'fpm'))

    $.say('Preparing stage2')
    const stage2_path = 'rpm-stage'
    base.prepare_stage2(build_path, stage2_path)

    const distro_files = '.=/'

    $($.sh(`fpm --force \
      -C ${stage2_path} -s dir -t rpm \
      --rpm-compression xz \
      --name "${$.app_name()}" \
      --description "${$.DESCRIPTION}" \
      --url "${$.HOMEPAGE}" \
      --version "${$.build_version()}" \
      --maintainer "${$.MAINTAINER}" \
      --architecture "${rpm_arch}" \
      --license "MIT" \
      --vendor "itch.io" \
      --category "games" \
      --after-install "release/debian-after-install.sh" \
      -d "p7zip" \
      -d "desktop-file-utils" \
      -d "libappindicator" \
      -d "libXScrnSaver" \
    ${distro_files}
    `))

    $($.sh('cp *.rpm packages/'))
  }
}
