
import spawn from '../../util/spawn'
import find_uninstallers from './find-uninstallers'

import AppActions from '../../actions/app-actions'

import blessing from './blessing'
import {Transition} from '../errors'

import mklog from '../../util/log'
const log = mklog('installers/inno')

// InnoSetup docs: http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline

const self = {
  log_path: function (operation, installer_path) {
    return `${installer_path}.${operation}.log.txt`
  },

  install: async function (opts) {
    await blessing(opts)

    AppActions.cave_progress({id: opts.id, progress: -1})

    let archive_path = opts.archive_path
    let dest_path = opts.dest_path
    let log_path = self.log_path('i', archive_path)

    let spawn_opts = {
      command: archive_path,
      args: [
        '/VERYSILENT', // run the installer silently
        '/SUPPRESSMSGBOXES', // don't show any dialogs
        '/NOCANCEL', // no going back
        '/NORESTART', // prevent installer from restarting system
        `/LOG=${log_path}`, // store log on disk
        `/DIR=${dest_path}` // install in apps directory if possible
      ],
      ontoken: (token) => log(opts, token)
    }
    let code = await spawn(spawn_opts)
    log(opts, `inno installer exited with code ${code}`)
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
      log(opts, `running inno uninstaller ${unins}`)
      let spawn_opts = {
        command: unins,
        args: [
          '/VERYSILENT' // be vewwy vewwy quiet
        ],
        opts: {cwd: dest_path},
        on_token: (tok) => log(opts, `${unins}: ${tok}`)
      }
      let code = await spawn(spawn_opts)
      log(opts, `inno uninstaller exited with code ${code}`)

      if (code !== 0) {
        let reason = 'uninstaller failed, cancelling uninstallation'
        throw new Transition({to: 'idle', reason})
      }
    }
  }
}

export default self
