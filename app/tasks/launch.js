
let _ = require('underscore')
let Promise = require('bluebird')

let path = require('path')
let shell_quote = require('shell-quote')

let os = require('../util/os')
let spawn = require('../util/spawn')
let sf = require('../util/sf')

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

  compute_weight: async function (app_path, execs) {
    let output = []

    let f = async (exe) => {
      let exe_path = path.join(app_path, exe.path)
      let stats
      try {
        stats = await sf.stat(exe_path)
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
    let output = []

    for (let exe of execs) {
      let score = 100

      if (/unins.*\.exe$/i.test(exe.path)) {
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
      if (/\.so/.test(exe.path)) {
        score = 0
      }
      if (/\.sh/.test(exe.path)) {
        score += 20
      }
      exe.score = score

      if (score > 0) {
        output.push(score)
      }
    }

    return output
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

    let candidates = cave.executables.map((path) => {
      return {path}
    })
    candidates = await self.compute_weight(app_path, candidates)
    candidates = self.compute_score(candidates)
    candidates = self.compute_depth(candidates)

    log(opts, `initial candidate set: ${JSON.stringify(candidates, null, 2)}`)

    candidates = _.sortBy(candidates, (x) => -x.weight)
    log(opts, `candidates after weight sorting: ${JSON.stringify(candidates, null, 2)}`)

    candidates = _.sortBy(candidates, (x) => -x.score)
    log(opts, `candidates after score sorting: ${JSON.stringify(candidates, null, 2)}`)

    candidates = _.sortBy(candidates, (x) => x.depth)
    log(opts, `candidates after depth sorting: ${JSON.stringify(candidates, null, 2)}`)

    let exe_path = path.join(app_path, candidates[0].path)
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
