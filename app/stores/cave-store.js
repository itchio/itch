

let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppConstants = require('../constants/app-constants')
let AppActions = require('../actions/app-actions')

let Store = require('./store')
let CredentialsStore = require('./credentials-store')
let PreferencesStore = require('./preferences-store')
let InstallLocationStore = require('./install-location-store')

let errors = require('../tasks/errors')
let Transition = errors.Transition
let InputRequired = errors.InputRequired
let Crash = errors.Crash

let path = require('path')
let deep = require('deep-diff')
let clone = require('clone')

let Logger = require('../util/log').Logger
let log = require('../util/log')('cave-store')
let db = require('../util/db')
let os = require('../util/os')
let diego = require('../util/diego')
let explorer = require('../util/explorer')

let fs = require('../promised/fs')

let electron = require('electron')

let EventEmitter = require('events').EventEmitter

const CAVE_TABLE = 'caves'

let old_state = {}
let state = {}
let cave_blacklist = {}

let natural_transitions = {
  'find-upload': 'download',
  'download': 'install',
  'install': 'configure'
}

let CaveStore = Object.assign(new Store('cave-store'), {
  get_state: function () {
    state
  },

  find: function (id) {
    return db.find_one({_table: CAVE_TABLE, _id: id})
  },

  find_for_game: function (game_id) {
    return db.find_one({_table: CAVE_TABLE, game_id: game_id})
  },

  install_location_dir: function (loc_name) {
    let loc_record = InstallLocationStore.get_location(loc_name || 'appdata')
    if (!loc_record) {
      throw new Error(`Unknown location: ${loc_name}`)
    }
    return loc_record.path
  },

  archive_path: function (loc, upload) {
    if (typeof upload === 'undefined') {
      throw new Error('Missing args for CaveStore.archive_path')
    }

    let loc_dir = CaveStore.install_location_dir(loc)
    return path.join(loc_dir, 'archives', `${upload.id}${path.extname(upload.filename)}`)
  },

  app_path: function (loc, cave_id) {
    if (typeof cave_id === 'undefined') {
      throw new Error('Missing args for CaveStore.app_path')
    }

    let loc_dir = CaveStore.install_location_dir(loc)
    return path.join(loc_dir, 'apps', cave_id)
  }
})

function log_path (cave_id) {
  let loc_dir = CaveStore.install_location_dir('appdata')
  return path.join(loc_dir, 'logs', cave_id + '.txt')
}

function emit_change () {
  let new_state = state
  let state_diff = deep.diff(old_state, new_state)

  if (!state_diff) return
  old_state = clone(state)
  AppActions.cave_store_diff(state_diff)

  CaveStore.emit_change()
}

let store_opts = {
  logger: new Logger()
}

let cave_opts_cache = {}

function cave_opts (id) {
  let cached = cave_opts_cache[id]
  if (cached) return cached

  let logger = new Logger({
    sinks: {
      console: false,
      file: log_path(id)
    }
  })
  let opts = { logger }
  cave_opts_cache[id] = opts

  log(opts, `~~~~~~~~~~~~~~~~ the village awakens ~~~~~~~~~~~~~~~~`)
  log(opts, `itch v${electron.app.getVersion()} to ground control, on ${os.itch_platform()}-${os.arch()}`)

  return opts
}

function handle_task_error (err, id, task_name) {
  if (err instanceof Transition) {
    log(cave_opts(id), `[${task_name} => ${err.to}] ${err.reason || ''}`)
    let data = err.data || {}
    setImmediate(() => queue_task(id, err.to, data))
  } else if (err instanceof InputRequired) {
    let msg = `(stub) input required by ${task_name}`
    log(cave_opts(id), msg)
    AppActions.cave_progress({id, task: 'error', error: msg})
  } else if (err instanceof Crash) {
    let msg = `crashed with: ${JSON.stringify(err, null, 2)}`
    log(cave_opts(id), msg)
    AppActions.cave_progress({id, task: 'idle', error: msg})
  } else {
    log(cave_opts(id), err.stack || err)
    AppActions.cave_progress({id, task: 'error', error: '' + err})
  }
}

let current_tasks = {}

function every_task () {
  let tasks = []
  for (let key of Object.keys(current_tasks)) {
    tasks.push(current_tasks[key])
  }
  return tasks
}

function num_downloads () {
  let count = 0
  for (let task of every_task()) {
    if (task.name === 'download') count++
  }
  return count
}

let max_downloads = 2

function recheck_pending_tasks () {
  let num_dl = num_downloads()

  if (num_dl >= max_downloads) {
    return
  }

  for (let task of every_task()) {
    if (task.name === 'download-queued') {
      task.opts.emitter.emit('shine')
      break
    }
  }
}

function set_current_task (id, data) {
  // potentially send an event here
  if (data) {
    current_tasks[id] = data
  } else {
    delete current_tasks[id]
    // maybe a download finished?
    recheck_pending_tasks()
  }
}

async function queue_task (id, task_name, data) {
  try {
    if (typeof data === 'undefined') {
      data = {}
    }

    if (current_tasks[id]) {
      log(cave_opts(id), `task already in progress for ${id}, ignoring ${task_name} request`)
      return
    }

    if (task_name === 'download' && num_downloads() >= max_downloads) {
      queue_task(id, 'download-queued')
      return
    }

    let task = require(`../tasks/${task_name}`)
    let emitter = Object.assign({}, EventEmitter.prototype)
    let task_opts = Object.assign({}, cave_opts(id), data, {
      id,
      emitter,
      onprogress: (state) => {
        AppActions.cave_progress({id, progress: state.percent * 0.01, task: task_name})
      }
    })
    log(cave_opts(id), `starting ${task_name}`)
    AppActions.cave_progress({id, progress: 0, task: task_name})

    set_current_task(id, {
      name: task_name,
      opts: task_opts
    })
    let res = await task.start(task_opts)
    set_current_task(id, null)

    if (task_name === 'install') {
      let cave = await CaveStore.find(id)
      if (!cave.success_once) {
        let game = await db.find_one({_table: 'games', id: cave.game_id})
        AppActions.notify(`${game.title} is ready!`)
        AppActions.cave_update(id, {success_once: true})
      }
    }

    let transition = natural_transitions[task_name]
    if (transition) throw new Transition({to: transition})

    log(cave_opts(id), `task ${task_name} finished with ${JSON.stringify(res)}`)
    if (task_name === 'uninstall') return

    AppActions.cave_progress({id, progress: 0})

    if (task_opts.then) {
      queue_task(id, task_opts.then)
    } else {
      AppActions.cave_progress({id, task: 'idle'})
    }
  } catch (err) {
    set_current_task(id, null)
    handle_task_error(err, id, task_name)
  }
}

async function initial_progress (record) {
  AppActions.cave_progress(Object.assign({id: record._id}, record))
  let game = await db.find_one({_table: 'games', id: record.game_id})
  AppActions.cave_progress({id: record._id, game})
}

async function queue_cave (game_id) {
  let install_location = PreferencesStore.get_state().default_install_location
  let data = { _table: CAVE_TABLE, game_id, install_location }
  let record = await db.insert(data)

  diego.hire(cave_opts(record._id))
  initial_progress(record)
  queue_task(record._id, 'download')
}

async function cave_explore (payload) {
  let cave = await CaveStore.find(payload.id)
  let app_path = CaveStore.app_path(cave.install_location, payload.id)

  try {
    await fs.lstatAsync(app_path)
    explorer.open(app_path)
  } catch (e) {
    cave_probe(payload)
  }
}

function cave_progress (payload) {
  let _id = payload.opts.id
  if (cave_blacklist[_id]) return

  if (typeof state[_id] === 'undefined') {
    state[_id] = {}
  }

  for (let key of Object.keys(payload.opts)) {
    let val = payload.opts[key]
    state[_id][key] = val
  }

  emit_change()
}

async function cave_probe (payload) {
  electron.shell.openItem(log_path(payload.id))
}

async function cave_queue (payload) {
  let record = await db.find_one({_table: CAVE_TABLE, game_id: payload.game_id})

  if (record) {
    if (record.launchable) {
      queue_task(record._id, 'launch')
    } else {
      queue_task(record._id, 'download')
    }
  } else {
    queue_cave(payload.game_id)
  }
}

async function cave_queue_uninstall (payload) {
  let record = await db.find_one({_table: CAVE_TABLE, _id: payload.id})

  if (record) {
    queue_task(record._id, 'uninstall')
  } else {
    log(store_opts, `asked to uninstall ${payload.id} but no record of it, ignoring`)
  }
}

async function cave_update (payload) {
  let _id = payload.id
  let data = payload.data
  if (cave_blacklist[_id]) return
  await db.merge_one({_table: CAVE_TABLE, _id}, data)
}

async function cave_implode (payload) {
  // don't accept any further updates to these caves, they're imploding.
  // useful in case child takes some time to exit after it receives SIGKILL
  cave_blacklist[payload.id] = true

  let task = current_tasks[payload.id]
  if (task) {
    task.opts.emitter.emit('cancel')
  }

  db.remove({_table: CAVE_TABLE, _id: payload.id})

  delete state[payload.id]
  emit_change()

  AppActions.cave_thrown_into_bit_bucket(payload.id)
}

async function authenticated (payload) {
  log(store_opts, `authenticated!`)
  let me = CredentialsStore.get_me()

  log(store_opts, `me = ${JSON.stringify(me, null, 2)}`)
  try {
    await db.load(me.id)
  } catch (e) {
    console.log(`error while db.loading: ${e.stack || e}`)
    require('../util/crash_reporter').handle(e)
    return
  }

  log(store_opts, `ready to roll (⌐■_■)`)
  AppActions.ready_to_roll()
}

async function locations_ready (payload) {
  let caves = await db.find({_table: CAVE_TABLE})
  caves.forEach((record, i) => {
    initial_progress(record)
    queue_task(record._id, 'awaken')
  })
}

function logout (payload) {
  db.unload()
}

AppDispatcher.register('cave-store', Store.action_listeners(on => {
  on(AppConstants.CAVE_QUEUE, cave_queue)
  on(AppConstants.CAVE_QUEUE_UNINSTALL, cave_queue_uninstall)
  on(AppConstants.CAVE_UPDATE, cave_update)
  on(AppConstants.CAVE_IMPLODE, cave_implode)
  on(AppConstants.CAVE_PROGRESS, cave_progress)
  on(AppConstants.CAVE_EXPLORE, cave_explore)
  on(AppConstants.CAVE_PROBE, cave_probe)

  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOCATIONS_READY, locations_ready)
  on(AppConstants.LOGOUT, logout)
}))

module.exports = CaveStore
