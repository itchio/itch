
import spawn from '../../util/spawn'
import find_uninstallers from './find-uninstallers'

import AppActions from '../../actions/app-actions'

import blessing from './blessing'
import {Transition} from '../errors'

import mklog from '../../util/log'
const log = mklog('installers/inno')

// InnoSetup docs: http://www.jrsoftware.org/ishelp/index.php?topic=setupcmdline

const self = {
  logPath: function (operation, installerPath) {
    return `${installerPath}.${operation}.log.txt`
  },

  install: async function (out, opts) {
    await blessing(opts)

    AppActions.cave_progress({id: opts.id, progress: -1})

    let archivePath = opts.archivePath
    let destPath = opts.destPath
    let logPath = self.logPath('i', archivePath)

    let spawnOpts = {
      command: archivePath,
      args: [
        '/VERYSILENT', // run the installer silently
        '/SUPPRESSMSGBOXES', // don't show any dialogs
        '/NOCANCEL', // no going back
        '/NORESTART', // prevent installer from restarting system
        `/LOG=${logPath}`, // store log on disk
        `/DIR=${destPath}` // install in apps directory if possible
      ],
      onToken: (token) => log(opts, token)
    }
    let code = await spawn(spawnOpts)
    log(opts, `inno installer exited with code ${code}`)
  },

  uninstall: async function (out, opts) {
    AppActions.cave_progress({id: opts.id, progress: -1})

    let destPath = opts.destPath
    let uninstallers = await find_uninstallers(destPath)

    if (uninstallers.length === 0) {
      log(opts, `could not find an uninstaller`)
      return
    }

    for (let unins of uninstallers) {
      log(opts, `running inno uninstaller ${unins}`)
      let spawnOpts = {
        command: unins,
        args: [
          '/VERYSILENT' // be vewwy vewwy quiet
        ],
        opts: {cwd: destPath},
        on_token: (tok) => log(opts, `${unins}: ${tok}`)
      }
      let code = await spawn(spawnOpts)
      log(opts, `inno uninstaller exited with code ${code}`)

      if (code !== 0) {
        let reason = 'uninstaller failed, cancelling uninstallation'
        throw new Transition({to: 'idle', reason})
      }
    }
  }
}

export default self
