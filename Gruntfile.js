
require('quiet-grunt')
var fs = require('fs')
var path = require('path')
var packagePath = path.join(__dirname, 'package.json')
var version = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' })).version
var icoPath = 'release/itchio.ico'
var installerGifPath = 'release/installer.gif'
var icnsPath = 'release/itchio.icns'

var electronVersion = '0.36.8'
var outDir = path.join('build', 'v' + version)
var companyName = 'Itch Corp'

var gruntElectronCommon = {
  dir: 'stage',
  name: 'itch',
  version: electronVersion,
  'app-version': version,
  prune: true,
  asar: true,
  overwrite: true,
  out: outDir
}

var windowsElectronOptions = Object.assign({}, gruntElectronCommon, {
  platform: 'win32',
  icon: icoPath,
  'version-string': {
    CompanyName: companyName,
    LegalCopyright: 'MIT license, (c) Itch Corp',
    FileDescription: 'itch',
    OriginalFileName: 'itch.exe',
    FileVersion: version,
    AppVersion: version,
    ProductName: 'itch',
    InternalName: 'itch.exe'
  }
})

var electronInstallerCommon = {
  authors: companyName,
  exe: 'itch.exe',
  description: 'The best way to play itch.io games',
  version: version,
  title: 'itch',
  iconUrl: 'http://raw.githubusercontent.com/itchio/itch/master/app/static/images/itchio.ico',
  loadingGif: installerGifPath,
  setupIcon: icoPath,
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
        }, windowsElectronOptions)
      },
      'darwin-x64': {
        options: Object.assign({}, gruntElectronCommon, {
          platform: 'darwin',
          arch: 'x64',
          icon: icnsPath,
          'app-bundle-id': 'io.itch.mac',
          'app-category-type': 'public.app-category.games',
          protocols: [{
            name: 'itch.io',
            schemes: ['itchio']
          }]
        })
      },
      'linux-ia32': {
        options: Object.assign({}, gruntElectronCommon, {
          platform: 'linux',
          arch: 'ia32'
        })
      },
      'linux-x64': {
        options: Object.assign({}, gruntElectronCommon, {
          platform: 'linux',
          arch: 'x64'
        })
      }
    },
    'create-windows-installer': {
      'ia32': Object.assign({}, electronInstallerCommon, {
        appDirectory: path.join(outDir, 'itch-win32-ia32'),
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
    },
    'babel': {
      options: {
        sourceMap: true
      },
      dist: {
        files: [
          { expand: true, cwd: 'appsrc', src: ['**/*.js'], dest: 'app' },
          { expand: true, cwd: 'testsrc', src: ['**/*.js'], dest: 'test' }
        ]
      }
    },
    'sass': {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'app/style/main.css': 'appsrc/style/**/*.scss'
        }
      }
    },
    'copy': {
      options: {
        mode: true
      },
      dist: {
        files: [
          { expand: true, cwd: 'appsrc', src: ['**/*.html', 'static/**'], dest: 'app' },
          { expand: true, cwd: 'testsrc', src: ['runner'], dest: 'test' }
        ]
      }
    }
  })

  grunt.registerTask('default', ['newer:babel', 'newer:sass', 'newer:copy'])
}
