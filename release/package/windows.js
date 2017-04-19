
const $ = require('../common')
const {join} = require('path')

module.exports = {
  sign: async function (arch, buildPath) {
    let exeName = `${$.appName()}.exe`;
    let exePath = join(buildPath, exeName).replace(/\\/g, "/");
    // see package function
    // forward-slashes are doubled because of mingw, see http://www.mingw.org/wiki/Posix_path_conversion
    let signParams = '//v //s MY //n "itch corp." //fd sha256 //tr http://timestamp.comodoca.com/?td=sha256 //td sha256'
    let signtoolPath = 'vendor/signtool.exe'
    $(await $.sh(`${signtoolPath} sign ${signParams} ${exePath}`))
  },

  package: async function (arch, buildPath) {
    $.say('Creating installer + nupkg full/delta files')
    $(await $.sh(`mkdir -p ${$.winstallerPath(arch)}`))
    const appName = $.appName();
    const appVersion = $.buildVersion()
    const outDir = path.join('build', 'v' + appVersion)
    const companyName = 'Itch Corp'
    const iconsPath = join('release', 'images', appName + '-icons')
    const icoPath = join(iconsPath, 'itch.ico')
    const installerGifPath = 'release/images/installer.gif'
    const electronInstaller = require('electron-winstaller')
    const electronInstallerOpts = {
      authors: companyName,
      exe: appName + '.exe',
      description: 'The best way to play itch.io games',
      version: appVersion,
      title: appName,
      // sic. it's really itch.ico, even for kitch
      iconUrl: 'http://raw.githubusercontent.com/itchio/itch/master/release/images/' + appName + '-icons/itch.ico',
      loadingGif: installerGifPath,
      setupIcon: icoPath,
      remoteReleases: 'https://github.com/itchio/' + appName,
      // see sign function
      signWithParams: '/v /s MY /n "itch corp." /fd sha256 /tr http://timestamp.comodoca.com/?td=sha256 /td sha256',
      noMsi: true,
      appDirectory: join(outDir, appName + '-win32-ia32'),
      outputDirectory: process.env.CI_WINDOWS_INSTALLER_PATH || path.join('build', 'squirrel-ia32')
    }
    await electronInstaller(electronInstallerOpts)

    $.say('Copying artifacts to packages/')
    $(await $.sh(`cp -vf ${$.winstallerPath(arch)}/${$.appName()}-${$.buildVersion()}*.nupkg ${$.winstallerPath(arch)}/*.exe ${$.winstallerPath(arch)}/RELEASES packages/`))
  }
}
