
import path from 'path'

import {sortBy} from 'underline'
import Promise from 'bluebird'
import shell_quote from 'shell-quote'

import os from '../../util/os'
import sf from '../../util/sf'
import spawn from '../../util/spawn'

import mklog from '../../util/log'
const log = mklog('tasks/launch')

import CaveStore from '../../stores/cave-store'
import {Crash} from '../errors'

const self = {
  sh: async function (exePath, full_command, opts) {
    log(opts, `sh ${full_command}`)

    const cwd = path.dirname(exePath)
    log(opts, `Working directory: ${cwd}`)

    const args = shell_quote.parse(full_command)
    const command = args.shift()

    const code = await spawn({
      command,
      args,
      onToken: (tok) => log(opts, `stdout: ${tok}`),
      onErrToken: (tok) => log(opts, `stderr: ${tok}`),
      opts: {cwd}
    })

    if (code !== 0) {
      const error = `process exited with code ${code}`
      throw new Crash({exePath, error})
    }
    return `child completed successfully`
  },

  escape: function (arg) {
    return `"${arg.replace(/"/g, '\\"')}"`
  },

  compute_weight: async function (appPath, execs) {
    const output = []

    const f = async (exe) => {
      const exePath = path.join(appPath, exe.path)
      let stats
      try {
        stats = await sf.stat(exePath)
      } catch (err) {
        // entering the ultra hat dimension
      }

      if (stats) {
        exe.weight = stats.size
        output.push(exe)
      }
    }
    await Promise.resolve(execs).map(f, {concurrency: 4})

    return output
  },

  compute_depth: function (execs) {
    for (let exe of execs) {
      exe.depth = path.normalize(exe.path).split(path.sep).length
    }

    return execs
  },

  compute_score: function (execs) {
    const output = []

    for (const exe of execs) {
      let score = 100

      if (/unins.*\.exe$/i.test(exe.path)) {
        score -= 50
      }
      if (/^kick\.bin/i.test(exe.path)) {
        score -= 50
      }
      if (/nwjc\.exe$/i.test(exe.path)) {
        score -= 20
      }
      if (/dxwebsetup\.exe$/i.test(exe.path)) {
        score = 0
      }
      if (/vcredist.*\.exe$/i.test(exe.path)) {
        score = 0
      }
      if (/\.(so|dylib)/.test(exe.path)) {
        score = 0
      }
      if (/\.sh/.test(exe.path)) {
        score += 20
      }
      exe.score = score

      if (score > 0) {
        output.push(exe)
      }
    }

    return output
  },

  launch_executable: function (exePath, args, opts) {
    const platform = os.platform()
    log(opts, `launching '${exePath}' on '${platform}' with args '${args.join(' ')}'`)
    const arg_string = args.map((x) => self.escape(x)).join(' ')

    if (platform === 'darwin' && /\.app\/?$/.test(exePath.toLowerCase())) {
      // '-W' waits for app to quit
      // potentially easy to inject something into the command line
      // here but then again we are running executables downloaded
      // from the internet.
      let cmd = `open -W ${self.escape(exePath)}`
      if (arg_string.length > 0) {
        cmd += ` --args ${arg_string}`
      }
      return self.sh(exePath, cmd, opts)
    } else {
      let cmd = `${self.escape(exePath)}`
      if (arg_string.length > 0) {
        cmd += ` ${arg_string}`
      }
      return self.sh(exePath, cmd, opts)
    }
  },

  launch: async function (opts, cave) {
    const appPath = CaveStore.appPath(cave.install_location, opts.id)

    let candidates = cave.executables.map((path) => {
      return {path}
    })
    candidates = await self.compute_weight(appPath, candidates)
    candidates = self.compute_score(candidates)
    candidates = self.compute_depth(candidates)

    log(opts, `initial candidate set: ${JSON.stringify(candidates, null, 2)}`)

    candidates = candidates::sortBy((x) => -x.weight)
    log(opts, `candidates after weight sorting: ${JSON.stringify(candidates, null, 2)}`)

    candidates = candidates::sortBy((x) => -x.score)
    log(opts, `candidates after score sorting: ${JSON.stringify(candidates, null, 2)}`)

    candidates = candidates::sortBy((x) => x.depth)
    log(opts, `candidates after depth sorting: ${JSON.stringify(candidates, null, 2)}`)

    let exePath = path.join(appPath, candidates[0].path)
    const args = []

    if (/\.jar$/i.test(exePath)) {
      log(opts, `Launching .jar`)
      args.push('-jar')
      args.push(exePath)
      exePath = 'java'
    }

    return self.launch_executable(exePath, args, opts)
  }
}

export default self
