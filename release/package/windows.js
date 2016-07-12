
const $ = require('../common')

module.exports = {
  package: function (arch, build_path) {
    $.say('Creating installer + nupkg full/delta files')
    $($.sh(`mkdir -p "${$.winstaller_path(arch)}"`))
    $($.grunt(`create-windows-installer:${$.ARCHES[arch].electron_arch}`))

    $.say('Copying artifacts to packages/')
    $($.sh(`cp -vf ${$.winstaller_path(arch)}/${$.app_name()}-${$.build_version()}*.nupkg} ${$.winstaller_path(arch)}/*.exe ${$.winstaller_path(arch)}/RELEASES packages/`))
  }
}
