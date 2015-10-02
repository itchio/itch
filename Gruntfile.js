
module.exports = function (grunt) {

  grunt.initConfig({
    'build-electron-app': {
      options: {
        platforms: ['win32']
      }
    },
    'create-windows-installer': {
      ia32: {
        appDirectory: 'build/win32',
        outputDirectory: 'build/installer-win32',
        authors: 'itch corp',
        exe: 'electron.exe'
      }
    }
  });

  grunt.loadNpmTasks('grunt-electron-app-builder');
  grunt.loadNpmTasks('grunt-electron-installer');
}

