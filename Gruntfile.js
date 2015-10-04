
var fs = require('fs');
var path = require('path');
var license_path = path.join(__dirname, 'LICENSE');
var license = fs.readFileSync(license_path, { encoding: 'utf8' });
var package_path = path.join(__dirname, 'app', 'package.json');
var version = JSON.parse(fs.readFileSync(package_path, { encoding: 'utf8' })).version;
var ico_path  = 'app/static/images/itchio.ico';
var icns_path = 'app/static/images/itchio.icns';
var out_dir = path.join('build', version);
var company_name = 'Itch Corp';

module.exports = function (grunt) {
  grunt.initConfig({
    'electron': {
      win32: {
        options: {
          dir: 'app',
          name: 'itch.io',
          platform: 'win32',
          arch: 'ia32',
          version: '0.33.4',
          out: out_dir,
          icon: ico_path,
          asar: true,
          'app-version': version,
          'version-string': {
            CompanyName: company_name,
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
      darwin: {
        options: {
          dir: 'app',
          name: 'itch.io',
          platform: 'darwin',
          arch: 'x64',
          version: '0.33.4',
          out: out_dir,
          icon: icns_path,
          asar: true,
          'app-version': version
        }
      },
      linux: {
        options: {
          dir: 'app',
          name: 'itch.io',
          platform: 'linux',
          arch: 'all',
          version: '0.33.4',
          out: out_dir,
          asar: true,
          'app-version': version
        }
      }
    },
    'create-windows-installer': {
      ia32: {
        appDirectory: path.join(out_dir, 'itch.io-win32-ia32'),
        outputDirectory: path.join('build', 'itch.io-win32-installer'),
        authors: company_name,
        exe: 'itch.io.exe',
        description: 'itch.io desktop app',
        version: version,
        title: 'itch.io',
        iconUrl: 'http://raw.githubusercontent.com/itchio/itchio-app/master/app/static/images/itchio.ico',
        setupIcon: ico_path,
        remoteReleases: 'https://github.com/itchio/itchio-app'
      }
    }
  });

  require('load-grunt-tasks')(grunt);
};

