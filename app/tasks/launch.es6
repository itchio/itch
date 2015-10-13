
import shell from 'shell'
import path from 'path'
import child_process from 'child_process'
import Promise from 'bluebird'

import os from '../util/os'

let log = require('../util/log')('tasks/launch')

import {Transition} from './errors'

import InstallStore from '../stores/install_store'

function sh (exe_path, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`sh ${cmd}`)

    // pretty weak but oh well.
    let forbidden = [';', '&&']
    for (let bidden of forbidden) {
      if (cmd.indexOf(bidden) >= 0) {
        throw new Error(`Command-line contains forbidden characters: ${cmd}`)
      }
    }

    let cwd = path.dirname(exe_path)
    console.log(`Working directory: ${cwd}`)

    child_process.exec(cmd, {
      stdio: [ 0, 'pipe', 'pipe' ],
      maxBuffer: 5000 * 1024,
      cwd
    }, (error, stdout, stderr) => {
      if (error) {
        console.log(`${exe_path} returned ${error}`)
        console.log('stdout: ')
        console.log(stdout)
        console.log('stderr: ')
        console.log(stderr)
        reject({ exe_path, error })
      } else {
        resolve(`Done playing ${exe_path}!`)
      }
    })
  })
}

function escape (arg) {
  return `"${arg.replace(/"/g, '\\"')}"`
}

export function launch (exe_path, args = []) {
  let platform = os.platform()
  console.log(`launching '${exe_path}' on '${platform}' with args '${args.join(' ')}'`)
  let arg_string = args.map((x) => escape(x)).join(' ')

  switch (platform) {
    case 'darwin':
      // '-W' waits for app to quit
      // potentially easy to inject something into the command line
      // here but then again we are running executables downloaded
      // from the internet.
      return sh(exe_path, `open -W ${escape(exe_path)} --args ${arg_string}`)

    case 'win32':
    case 'linux':
      return sh(exe_path, `${escape(exe_path)} ${arg_string}`)

    default:
      // don't know how to launch, try to open with OS?
      shell.openItem(exe_path)
      return Promise.resolve(`Opened ${exe_path} in shell!`)
  }
}

export function start (opts) {
  let {id} = opts
  let install

  return InstallStore.get_install(id).then((res) => {
    install = res
    log(opts, 'got install')

    if (!install.executables) {
      throw new Transition({
        to: 'configure',
        reason: 'no executables found',
        data: { then: 'launch' }
      })
    }

    let exe_path = install.executables[0]
    return launch(exe_path)
  })
}

export default { start, launch }
