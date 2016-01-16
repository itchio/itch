
let spawn = require('../../util/spawn')
let find_uninstallers = require('./find-uninstallers')

let AppActions = require('../../actions/app-actions')

let blessing = require('./blessing')
let errors = require('../errors')
let sf = require('../../util/sf')

let log = require('../../util/log')('installers/nsis')

// NSIS docs: http://nsis.sourceforge.net/Docs/Chapter3.html
// When ran without elevate, some NSIS installers will silently fail.
// So, we run them with elevate all the time.

let self = {
  install: async function (opts) {
    await blessing(opts)
    AppActions.cave_progress({id: opts.id, progress: -1})

    let inst = opts.archive_path
    let dest_path = opts.dest_path

    let remove_after_usage = false

    if (!/\.exe$/i.test(inst)) {
      // copy to temporary file, otherwise windows will refuse to open them
      // cf. https://github.com/itchio/itch/issues/322
      inst += '.exe'
      await sf.ditto(opts.archive_path, inst)
      remove_after_usage = true
    }

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

    if (remove_after_usage) {
      await sf.wipe(inst)
    }

    if (code !== 0) {
      throw new Error(`elevate / nsis installer exited with code ${code}`)
    }

    log(opts, `elevate/nsis installer completed successfully`)
  },

  uninstall: async function (opts) {
    AppActions.cave_progress({id: opts.id, progress: -1})

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
