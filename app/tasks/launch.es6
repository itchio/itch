
import shell from 'shell'
import path from 'path'
import child_process from 'child_process'
import clone from 'clone'
import Promise from 'bluebird'

import os from '../util/os'

let log = require('../util/log')('tasks/launch')
import configure from './configure'

import InstallStore from '../stores/install-store'

let self = {
  sh: function (exe_path, cmd, opts) {
    return new Promise((resolve, reject) => {
      log(opts, `sh ${cmd}`)

      // pretty weak but oh well.
      let forbidden = [';', '&']
      for (let bidden of forbidden) {
        if (cmd.indexOf(bidden) >= 0) {
          throw new Error(`Command-line contains forbidden characters: ${cmd}`)
        }
      }

      let cwd = path.dirname(exe_path)
      log(opts, `Working directory: ${cwd}`)

      child_process.exec(cmd, {
        stdio: [ 0, 'pipe', 'pipe' ],
        maxBuffer: 5000 * 1024,
        cwd
      }, (error, stdout, stderr) => {
        if (error) {
          log(opts, `${exe_path} returned ${error}`)
          log(opts, `stdout:\n${stdout}`)
          log(opts, `stderr:\n${stderr}`)
          reject({ exe_path, error })
        } else {
          resolve(`Done playing ${exe_path}!`)
        }
      })
    })
  },

  escape: function (arg) {
    return `"${arg.replace(/"/g, '\\"')}"`
  },

  sort_by_depth: function (execs) {
    let depths = {}
    for (let exe of execs) {
      depths[exe] = path.normalize(exe).split(path.sep).length
    }
    return clone(execs).sort((a, b) => depths[a] - depths[b])
  },

  launch: function (exe_path, args, opts) {
    let platform = os.platform()
    log(opts, `launching '${exe_path}' on '${platform}' with args '${args.join(' ')}'`)
    let arg_string = args.map((x) => self.escape(x)).join(' ')

    switch (platform) {
      case 'darwin': {
        // '-W' waits for app to quit
        // potentially easy to inject something into the command line
        // here but then again we are running executables downloaded
        // from the internet.
        let cmd = `open -W ${self.escape(exe_path)}`
        if (arg_string.length > 0) {
          cmd += ` --args ${arg_string}`
        }
        return self.sh(exe_path, cmd, opts)
      }

      case 'win32':
      case 'linux': {
        let cmd = `${self.escape(exe_path)}`
        if (arg_string.length > 0) {
          cmd += ` ${arg_string}`
        }
        return self.sh(exe_path, cmd, opts)
      }

      default:
        // don't know how to launch, try to open with OS?
        shell.openItem(exe_path)
        return Promise.resolve(`Opened ${exe_path} in shell!`)
    }
  },

  launch_install: function (opts, install) {
    let sorted = self.sort_by_depth(install.executables)
    log(opts, `executables (from best to worst): ${JSON.stringify(sorted, null, 2)}`)
    let exe_path = sorted[0]
    return self.launch(exe_path, [], opts)
  },

  valid_install: function (install) {
    return install.executables && install.executables.length > 0
  },

  start: function (opts) {
    let {id} = opts

    return InstallStore.get_install(id).then((install) => {
      if (!self.valid_install(install)) {
        return configure.start(opts).then(() => {
          if (!self.valid_install(install)) {
            throw new Error('No executables found')
          }
          InstallStore.get_install(id).then((install) =>
            self.launch_install(opts, install)
          )
        })
      }

      return install
    }).then(install => self.launch_install(opts, install))
  }
}

export default self
