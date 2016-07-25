
const $ = require('../../common')

module.exports = {
  prepare_stage2: function (build_path, stage2_path) {
    $($.sh(`rm -rf ${stage2_path}`))
    $($.sh(`mkdir -p ${stage2_path}`))

    $.say('Creating base directories')
    ;['/usr/bin', `/usr/lib/${$.app_name()}`, '/usr/share/applications', '/usr/share/metainfo', `/usr/share/doc/${$.app_name()}`, '/usr/share/man/man6'].forEach(function (path) {
      $($.sh(`mkdir -p "${stage2_path}${path}"`))
    })

    $.say('Copying binaries')
    $($.sh(`cp -rf ${build_path}/* "${stage2_path}/usr/lib/${$.app_name()}"`))
    $($.sh(`ln -s "../lib/${$.app_name()}/${$.app_name()}" "${stage2_path}/usr/bin/${$.app_name()}"`))

    $.say('Copying icons')
    ;['16', '32', '48', '64', '128', '256', '512'].forEach(function (size) {
      const dir = `${stage2_path}/usr/share/icons/hicolor/${size}x${size}/apps`
      $($.sh(`mkdir -p "${dir}"`))
      $($.sh(`cp "release/images/${$.app_name()}-icons/icon${size}.png" "${dir}/${$.app_name()}.png"`))
    })

    $.say('Copying linux extras')
    $($.sh(`cp "linux-extras/${$.app_name()}.desktop" "${stage2_path}/usr/share/applications/${$.app_name()}.desktop"`))
    $($.sh(`cp "linux-extras/${$.app_name()}.6" "${stage2_path}/usr/share/man/man6/${$.app_name()}.6"`))
    $($.sh(`cp "linux-extras/${$.app_name()}.appdata.xml" "${stage2_path}/usr/share/metainfo/${$.app_name()}.appdata.xml"`))
  }
}
