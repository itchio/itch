
const $ = require('../common')

module.exports = {
  sign: function (arch, build_path) {
    let exe_path = `${build_path}/${$.app_name()}.exe`
    // see Gruntfile.js (which will die eventually)
    let sign_params = '/v /s MY /n "itch corp." /fd sha256 /tr http://timestamp.comodoca.com/?td=sha256 /td sha256'
    let signtool_path = 'vendor/signtool.exe'
    $($.sh(`${signtool_path} sign ${sign_params} ${exe_path}`))
  },

  package: function (arch, build_path) {
    $.say('Creating installer + nupkg full/delta files')
    $($.sh(`mkdir -p ${$.winstaller_path(arch)}`))
    $($.grunt(`create-windows-installer:${$.ARCHES[arch].electron_arch}`))

    $.say('Copying artifacts to packages/')
    $($.sh(`cp -vf ${$.winstaller_path(arch)}/${$.app_name()}-${$.build_version()}*.nupkg ${$.winstaller_path(arch)}/*.exe ${$.winstaller_path(arch)}/RELEASES packages/`))
  }
}
