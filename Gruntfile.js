
var fs = require('fs');
var path = require('path');
var license_path = path.join(__dirname, 'LICENSE');
var license = fs.readFileSync(license_path, { encoding: 'utf8' });
var package_path = path.join(__dirname, 'app', 'package.json');
var version = JSON.parse(fs.readFileSync(package_path, { encoding: 'utf8' })).version;

module.exports = function (grunt) {
  grunt.initConfig({
    'electron': {
      win32Build: {
        options: {
          dir: 'app',
          name: 'itch.io',
          platform: 'win32',
          arch: 'ia32',
          version: '0.33.4',
          out: 'build',
          icon: 'app/static/images/itchio.ico',
          asar: true,
          'app-version': version,
          'version-string': {
            CompanyName: 'itch corp',
            LegalCopyright: license,
            FileDescription: 'itch.io desktop client',
            OriginalFileName: 'itch.io.exe',
            FileVersion: version,
            AppVersion: version,
            ProductName: 'itch.io',
            InternalName: 'itch.io.exe'
          }
        }
      },
      osxBuild: {
        options: {
          dir: 'app',
          name: 'itch.io',
          platform: 'darwin',
          arch: 'x64',
          version: '0.33.4',
          out: 'build',
          icon: 'app/static/image/itchio.icns',
          asar: true,
          'app-version': version
        }
      }
    },
    'create-windows-installer': {
      ia32: {
        appDirectory: 'build/itch.io-win32-ia32',
        outputDirectory: 'build/installer-win32',
        authors: 'itch corp',
        exe: 'itch.io.exe'
      }
    }
  });

  require('load-grunt-tasks')(grunt);
}

