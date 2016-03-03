
import spawn from '../../util/spawn'
import find_uninstallers from './find-uninstallers'

import AppActions from '../../actions/app-actions'

import {Transition} from '../errors'
import blessing from './blessing'
import sf from '../../util/sf'

import mklog from '../../util/log'
const log = mklog('installers/nsis')

// NSIS docs: http://nsis.sourceforge.net/Docs/Chapter3.html
// When ran without elevate, some NSIS installers will silently fail.
// So, we run them with elevate all the time.

const self = {
  install: async function (opts) {
    await blessing(opts)
    AppActions.cave_progress({id: opts.id, progress: -1})

    let inst = opts.archive_path
    const dest_path = opts.dest_path

    let remove_after_usage = false

    if (!/\.exe$/i.test(inst)) {
      // copy to temporary file, otherwise windows will refuse to open them
      // cf. https://github.com/itchio/itch/issues/322
      inst += '.exe'
      await sf.ditto(opts.archive_path, inst)
      remove_after_usage = true
    }

    const code = await spawn({
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

    const dest_path = opts.dest_path
    const uninstallers = await find_uninstallers(dest_path)

    if (uninstallers.length === 0) {
      log(opts, `could not find an uninstaller`)
      return
    }

    for (const unins of uninstallers) {
      log(opts, `running nsis uninstaller ${unins}`)
      const spawn_opts = {
        command: 'elevate.exe',
        args: [
          unins,
          '/S', // run the uninstaller silently
          `_?=${dest_path}` // specify uninstallation path
        ],
        opts: { cwd: dest_path },
        on_token: (tok) => log(opts, `${unins}: ${tok}`)
      }
      const code = await spawn(spawn_opts)
      log(opts, `elevate / nsis uninstaller exited with code ${code}`)

      if (code !== 0) {
        const reason = 'uninstaller failed, cancelling uninstallation'
        throw new Transition({ to: 'idle', reason })
      }
    }
  }
}

export default self
