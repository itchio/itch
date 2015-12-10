
var fs = require('fs')
var path = require('path')
var license_path = path.join(__dirname, 'LICENSE')
var license = fs.readFileSync(license_path, { encoding: 'utf8' })
var package_path = path.join(__dirname, 'package.json')
var version = JSON.parse(fs.readFileSync(package_path, { encoding: 'utf8' })).version
var ico_path = 'app/static/images/itchio.ico'
var icns_path = 'app/static/images/itchio.icns'
var electron_version = '0.35.4'
var out_dir = path.join('build', version)
var company_name = 'Itch Corp'

var grunt_electron_common = {
  dir: '.',
  ignore: '(test|build|coverage|tmp)',
  name: 'itch',
  version: electron_version,
  'app-version': version,
  prune: true,
  asar: true,
  overwrite: true,
  out: out_dir
}

var electron_installer_common = {
  authors: company_name,
  exe: 'itch.exe',
  description: 'itch.io desktop app',
  version: version,
  title: 'itch',
  iconUrl: 'http://raw.githubusercontent.com/itchio/itch/master/app/static/images/itchio.ico',
  setupIcon: ico_path,
  remoteReleases: 'https://github.com/itchio/itch',
  certificateFile: '../itchio-app-secrets/certificate.cer'
}

var windows_electron_options = Object.assign({}, grunt_electron_common, {
  platform: 'win32',
  icon: ico_path,
  'version-string': {
    CompanyName: company_name,
    LegalCopyright: license,
    FileDescription: 'itch.io desktop app',
    OriginalFileName: 'itch.exe',
    FileVersion: version,
    AppVersion: version,
    ProductName: 'itch',
    InternalName: 'itch.exe'
  }
})

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    // Create a .exe, .app, folder for windows, mac, linux
    electron: {
      'windows-386': {
        options: Object.assign({
          arch: 'ia32' 
        }, windows_electron_options)
      },
      'windows-amd64': {
        options: Object.assign({
          arch: 'x64' 
        }, windows_electron_options)
      },
      'darwin-amd64': {
        options: Object.assign({}, grunt_electron_common, {
          platform: 'darwin',
          arch: 'x64',
          icon: icns_path,
          protocols: [{
            name: 'itch',
            schemes: ['itch']
          }]
        })
      },
      'linux-386': {
        options: Object.assign({}, grunt_electron_common, {
          platform: 'linux',
          arch: 'ia32'
        })
      },
      'linux-amd64': {
        options: Object.assign({}, grunt_electron_common, {
          platform: 'linux',
          arch: 'x64'
        })
      }
    },
    'create-windows-installer': {
      '386': Object.assign({}, electron_installer_common, {
        appDirectory: path.join(out_dir, 'itch-win32-ia32'),
        outputDirectory: path.join('build', 'itch-win32-installer')
      }),
      'amd64': Object.assign({}, electron_installer_common, {
        appDirectory: path.join(out_dir, 'itch-win32-x64'),
        outputDirectory: path.join('build', 'itch-win32-installer')
      })
    }
  })
}
