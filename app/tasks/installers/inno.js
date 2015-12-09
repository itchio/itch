'use nodent';'use strict'

let spawn = require('../../util/spawn')

let log = require('../../util/log')('installers/inno')

let self = {
  log_path: function (operation, installer_path) {
    return `${installer_path}.${operation}.log.txt`
  },

  install: async function (opts) {
    let {archive_path, dest_path, logger} = opts
    let log_path = self.log_path('i', archive_path)

    await spawn({
      command: archive_path,
      args: [
        '/VERYSILENT', // run the installer silently
        '/SUPPRESSMSGBOXES', // don't show any dialogs
        '/NOCANCEL', // no going back
        '/NORESTART', // prevent installer from restarting system
        `/LOG=${log_path}`, // store log on disk
        `/DIR=${dest_path}` // install in apps directory if possible
      ],
      ontoken: (token) => log(opts, token),
      logger
    })
  },

  uninstall: async function (opts) {
    // TODO: find unins*.exe file in dest_path, run it with /VERYSILENT
    throw new Error('inno/uninstall: stub')
  }
}

module.exports = self
