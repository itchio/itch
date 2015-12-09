'use nodent';'use strict'

import spawn from '../../util/spawn'

let log = require('../../util/log')('installers/nsis')

let self = {
  install: async function (opts) {
    let {archive_path, dest_path, logger} = opts

    let code = await spawn({
      command: 'elevate.exe',
      args: [
        archive_path,
        '/S', // run the installer silently
        '/NCRC', // disable CRC-check, we do hash checking ourselves
        `/D=${dest_path}`
      ],
      ontoken: (token) => log(opts, token),
      logger
    })
    log(opts, `elevate / nsis installer exited with code ${code}`)
  },

  uninstall: async function (opts) {
    // TODO: find unins*.exe file in dest_path, run it with
    // by setting _?= to dest_path
    throw new Error('nsis/uninstall: stub')
  }
}

export default self
