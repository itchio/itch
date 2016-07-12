
const $ = require('../common')

module.exports = {
  package: function (arch, build_path) {
    $.say('Creating installer + nupkg full/delta files')
    $($.sh(`mkdir -p "${$.WINSTALLER_PATH}"`))
    $($.grunt(`create-windows-installer:${$.ARCHES[arch].electron_arch}`))

    $.say('Copying artifacts to packages/')
    $($.sh(`cp -vf ${$.WINSTALLER_PATH}/${$.app_name()}-${$.build_version()}*.nupkg} ${$.WINSTALLER_PATH}/*.exe ${$.WINSTALLER_PATH}/RELEASES packages/`))
  }
}
