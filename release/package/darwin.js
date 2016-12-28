
const $ = require('../common')

module.exports = {
  sign: function (arch, build_path) {
    let app_bundle = `${build_path}/${$.app_name()}.app`

    $.say('Signing Application bundle...')
    const sign_key = 'Developer ID Application: Amos Wenger (B2N6FSRTPV)'
    $($.sh(`codesign --deep --force --verbose --sign "${sign_key}" ${app_bundle}`))
    $($.sh(`codesign --verify -vvvv ${app_bundle}`))
    $($.sh(`spctl -a -vvvv ${app_bundle}`))
  },

  package: function (arch, build_path) {
    $.show_versions(['7za'])
    $($.npm_dep('appdmg', 'appdmg'))

    $.say('Moving app bundle somewhere more palatable')
    $($.sh(`ditto -v "${build_path}/${$.app_name()}.app" ${$.app_name()}.app`))

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
