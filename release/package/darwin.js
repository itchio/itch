
const $ = require('../common')

module.exports = {
  package: function (arch, build_path) {
    $.show_versions(['7za'])
    $($.npm_dep('appdmg', 'appdmg'))

    $.say('Signing Application bundle...')
    const sign_key = 'Developer ID Application: Amos Wenger (B2N6FSRTPV)'
    $($.sh(`ditto -v "${build_path}/${$.app_name()}.app" ${$.app_name()}.app`))
    $($.sh(`codesign --deep --force --verbose --sign "${sign_key}" ${$.app_name()}.app`))
    $($.sh(`codesign --verify -vvvv ${$.app_name()}.app`))
    $($.sh(`spctl -a -vvvv ${$.app_name()}.app`))

    $.say('Compressing .zip archive')
    $($.sh(`7za a packages/${$.app_name()}-mac.zip ${$.app_name()}.app`))

    $.say('Creating a .dmg volume')
    const dmgjson = {
      title: $.app_name(),
      icon: `../release/images/${$.app_name()}-icons/itch.icns`, // sic. it's really itch.icns
      background: '../release/images/dmgbg.png',
      ['icon-size']: 80,
      contents: [
        {x: 190, y: 382, type: 'file', path: `../${$.app_name()}.app`},
        {x: 425, y: 382, type: 'link', path: '/Applications'}
      ]
    }
    $.write_file('build/appdmg.json', JSON.stringify(dmgjson, 0, 2))

    $($.sh(`appdmg build/appdmg.json packages/${$.app_name()}-mac.dmg`))
  }
}
