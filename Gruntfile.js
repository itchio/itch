
var fs = require('fs')
var path = require('path')
var package_path = path.join(__dirname, 'package.json')
var version = JSON.parse(fs.readFileSync(package_path, { encoding: 'utf8' })).version
var ico_path = 'app/static/images/itchio.ico'
var icns_path = 'app/static/images/itchio.icns'
var electron_version = '0.36.2'
var out_dir = path.join('build', 'v' + version)
var company_name = 'Itch Corp'

var grunt_electron_common = {
  dir: 'stage',
  name: 'itch',
  version: electron_version,
  'app-version': version,
  prune: true,
  asar: true,
  overwrite: true,
  out: out_dir
}

var windows_electron_options = Object.assign({}, grunt_electron_common, {
  platform: 'win32',
  icon: ico_path,
  'version-string': {
    CompanyName: company_name,
    LegalCopyright: 'MIT license, (c) Itch Corp',
    FileDescription: 'itch',
    OriginalFileName: 'itch.exe',
    FileVersion: version,
    AppVersion: version,
    ProductName: 'itch',
    InternalName: 'itch.exe'
  }
})

var electron_installer_common = {
  authors: company_name,
  exe: 'itch.exe',
  description: 'The best way to play itch.io games',
  version: version,
  title: 'itch',
  iconUrl: 'http://raw.githubusercontent.com/itchio/itch/master/app/static/images/itchio.ico',
  setupIcon: ico_path,
  remoteReleases: 'https://github.com/itchio/itch',
  signWithParams: '/v /s MY /n "Open Source Developer, Amos Wenger" /t http://timestamp.verisign.com/scripts/timstamp.dll',
  noMsi: true
}

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    // Create a .exe, .app, folder for windows, mac, linux
    electron: {
      'windows-ia32': {
        options: Object.assign({
          arch: 'ia32'
        }, windows_electron_options)
      },
      'darwin-x64': {
        options: Object.assign({}, grunt_electron_common, {
          platform: 'darwin',
          arch: 'x64',
          icon: icns_path,
          'app-bundle-id': 'io.itch.mac',
          'app-category-type': 'public.app-category.games',
          protocols: [{
            name: 'itch.io',
            schemes: ['itchio']
          }]
        })
      },
      'linux-ia32': {
        options: Object.assign({}, grunt_electron_common, {
          platform: 'linux',
          arch: 'ia32'
        })
      },
      'linux-x64': {
        options: Object.assign({}, grunt_electron_common, {
          platform: 'linux',
          arch: 'x64'
        })
      }
    },
    'create-windows-installer': {
      'ia32': Object.assign({}, electron_installer_common, {
        appDirectory: path.join(out_dir, 'itch-win32-ia32'),
        outputDirectory: process.env.JENKINS_WINDOWS_INSTALLER_PATH || path.join('build', 'squirrel-ia32')
      })
    },
    'bump': {
      options: {
        files: ['package.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: ':arrow_up: v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false,
        prereleaseName: false,
        metadata: '',
        regExp: false
      }
    }
  })

  grunt.registerTask('default', ['shell:sass'])
}
