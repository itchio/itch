'use strict'

let path = require('path')
let clone = require('clone')

let os = require('../util/os')
let spawn = require('../util/spawn')

let log = require('../util/log')('tasks/launch')
let configure = require('./configure')

let CaveStore = require('../stores/cave-store')
let Crash = require('./errors').Crash

let self = {
  sh: async function (exe_path, command, opts) {
    log(opts, `sh ${command}`)

    // pretty weak but oh well.
    let forbidden = [';', '&']
    for (let bidden of forbidden) {
      if (command.indexOf(bidden) !== -1) {
        throw new Error(`Command-line contains forbidden characters: ${command}`)
      }
    }

    let cwd = path.dirname(exe_path)
    log(opts, `Working directory: ${cwd}`)

    let res = await spawn({
      command,
      ontoken: (tok) => log(opts, `stdout: ${tok}`),
      onerrtoken: (tok) => log(opts, `stderr: ${tok}`),
      opts: { cwd }
    })

    if (res.code !== 0) {
      let error = `process exited with code ${res.code}`
      throw new Crash({ exe_path, error })
    }
    return `child completed successfully`
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
