
let spawn = require('../../util/spawn')
let find_uninstallers = require('./find-uninstallers')

let errors = require('../errors')

let log = require('../../util/log')('installers/nsis')

// NSIS docs: http://nsis.sourceforge.net/Docs/Chapter3.html
// When ran without elevate, some NSIS installers will silently fail.
// So, we run them with elevate all the time.

let self = {
  install: async function (opts) {
    if (!opts.has_user_blessing) {
      throw new errors.Transition({
        to: 'ask-before-install',
        reason: `going to pop up an UAC dialog, need user's permission first`
      })
    }

    let inst = opts.archive_path
    let dest_path = opts.dest_path

    let code = await spawn({
      command: 'elevate.exe',
      args: [
        inst,
        '/S', // run the installer silently
        '/NCRC', // disable CRC-check, we do hash checking ourselves
        `/D=${dest_path}`
      ],
      ontoken: (tok) => log(opts, `${inst}: ${tok}`)
    })
    log(opts, `elevate / nsis installer exited with code ${code}`)
  },

  uninstall: async function (opts) {
    let dest_path = opts.dest_path
    let uninstallers = await find_uninstallers(dest_path)

    if (uninstallers.length === 0) {
      log(opts, `could not find an uninstaller`)
      return
    }

    for (let unins of uninstallers) {
      log(opts, `running nsis uninstaller ${unins}`)
      let spawn_opts = {
        command: 'elevate.exe',
        args: [
          unins,
          '/S', // run the uninstaller silently
          `_?=${dest_path}` // specify uninstallation path
        ],
        opts: { cwd: dest_path },
        on_token: (tok) => log(opts, `${unins}: ${tok}`)
      }
      let code = await spawn(spawn_opts)
      log(opts, `elevate / nsis uninstaller exited with code ${code}`)

      if (code !== 0) {
        let reason = 'uninstaller failed, cancelling uninstallation'
        throw new errors.Transition({
          to: 'idle',
          reason
        })
      }
    }
  }
}

module.exports = self
