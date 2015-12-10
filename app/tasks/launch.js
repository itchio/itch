'use strict'

let path = require('path')
let child_process = require('child_process')
let clone = require('clone')
let Promise = require('bluebird')

let os = require('../util/os')

let log = require('../util/log')('tasks/launch')
let configure = require('./configure')

let CaveStore = require('../stores/cave-store')
let Crash = require('./errors').Crash

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
          reject(new Crash({ exe_path, error }))
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

  sort_by_score: function (execs) {
    let scores = {}
    for (let exe of execs) {
      let score = 100
      if (/unins/.test(exe)) {
        score = 0
      }
      scores[exe] = score
    }
    return clone(execs).sort((a, b) => scores[b] - scores[a])
  },

  launch: function (exe_path, args, opts) {
    let platform = os.platform()
    log(opts, `launching '${exe_path}' on '${platform}' with args '${args.join(' ')}'`)
    let arg_string = args.map((x) => self.escape(x)).join(' ')

    if (platform === 'darwin' && /\.app\/?$/.test(exe_path.toLowerCase())) {
      // '-W' waits for app to quit
      // potentially easy to inject something into the command line
      // here but then again we are running executables downloaded
      // from the internet.
      let cmd = `open -W ${self.escape(exe_path)}`
      if (arg_string.length > 0) {
        cmd += ` --args ${arg_string}`
      }
      return self.sh(exe_path, cmd, opts)
    } else {
      let cmd = `${self.escape(exe_path)}`
      if (arg_string.length > 0) {
        cmd += ` ${arg_string}`
      }
      return self.sh(exe_path, cmd, opts)
    }
  },

  launch_cave: function (opts, cave) {
    let by_score = self.sort_by_score(cave.executables)
    let by_depth = self.sort_by_depth(by_score)
    let sorted = by_depth

    log(opts, `executables (from best to worst): ${JSON.stringify(sorted, null, 2)}`)
    let app_path = CaveStore.app_path(opts.id)
    let exe_path = path.join(app_path, sorted[0])
    return self.launch(exe_path, [], opts)
  },

  valid_cave: function (cave) {
    return cave.executables && cave.executables.length > 0
  },

  start: async function (opts) {
    let id = opts.id

    let cave = await CaveStore.find(id)
    if (!self.valid_cave(cave)) {
      await configure.start(opts)
      cave = await CaveStore.find(id)
    }

    if (!self.valid_cave(cave)) {
      throw new Error('No executables found')
    }

    await self.launch_cave(opts, cave)
  }
}

module.exports = self
