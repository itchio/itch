
let Promise = require('bluebird')

let path = require('path')
let clone = require('clone')
let shell_quote = require('shell-quote')

let os = require('../util/os')
let spawn = require('../util/spawn')
let fs = require('../promised/fs')

let log = require('../util/log')('tasks/launch')
let configure = require('./configure')

let CaveStore = require('../stores/cave-store')
let Crash = require('./errors').Crash

let self = {
  sh: async function (exe_path, full_command, opts) {
    log(opts, `sh ${full_command}`)

    // pretty weak but oh well.
    let forbidden = [';', '&']
    for (let bidden of forbidden) {
      if (full_command.indexOf(bidden) !== -1) {
        throw new Error(`Command-line contains forbidden characters: ${full_command}`)
      }
    }

    let cwd = path.dirname(exe_path)
    log(opts, `Working directory: ${cwd}`)

    let args = shell_quote.parse(full_command)
    let command = args.shift()

    let code = await spawn({
      command,
      args,
      ontoken: (tok) => log(opts, `stdout: ${tok}`),
      onerrtoken: (tok) => log(opts, `stderr: ${tok}`),
      opts: { cwd }
    })

    if (code !== 0) {
      let error = `process exited with code ${code}`
      throw new Crash({ exe_path, error })
    }
    return `child completed successfully`
  },

  escape: function (arg) {
    return `"${arg.replace(/"/g, '\\"')}"`
  },

  sort_by_weight: async function (app_path, execs) {
    let weights = {}

    let f = async (exe) => {
      let exe_path = path.join(app_path, exe)
      let stats = await fs.statAsync(exe_path)
      weights[exe] = stats.size
    }
    await Promise.resolve(execs).map(f, {concurrency: 2})

    // sort from heaviest to lightest
    return clone(execs).sort((a, b) => weights[b] - weights[a])
  },

  sort_by_depth: function (execs) {
    let depths = {}
    for (let exe of execs) {
      depths[exe] = path.normalize(exe).split(path.sep).length
    }

    // sort from least amount of path elements to most
    return clone(execs).sort((a, b) => depths[a] - depths[b])
  },

  sort_by_score: function (execs) {
    let scores = {}
    for (let exe of execs) {
      let score = 100
      if (/unins/.test(exe)) {
        score = 0
      } else if (/dxwebsetup\.exe/i.test(exe)) {
        score = 0
      }
      if (/\.so$/.test(exe)) {
        score -= 50
      }
      scores[exe] = score
    }

    // sort from most score to least
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

  launch_cave: async function (opts, cave) {
    let app_path = CaveStore.app_path(cave.install_location, opts.id)

    let by_weight = await self.sort_by_weight(app_path, cave.executables)
    let by_score = self.sort_by_score(by_weight)
    let by_depth = self.sort_by_depth(by_score)
    let sorted = by_depth

    log(opts, `executables (from best to worst): ${JSON.stringify(sorted, null, 2)}`)
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
