
let AppDispatcher = require('../dispatcher/app-dispatcher')
let AppActions = require('../actions/app-actions')
let AppConstants = require('../constants/app-constants')
let classification_actions = require('../constants/classification-actions')

let Store = require('./store')
let CredentialsStore = require('./credentials-store')
let PreferencesStore = require('./preferences-store')
let InstallLocationStore = require('./install-location-store')
let I18nStore = require('./i18n-store')

let errors = require('../tasks/errors')

let path = require('path')
let deep = require('deep-diff')
let clone = require('clone')

let Logger = require('../util/log').Logger
let log = require('../util/log')('cave-store')
let db = require('../util/db')
let os = require('../util/os')
let diego = require('../util/diego')
let explorer = require('../util/explorer')
let sf = require('../util/sf')

let electron = require('electron')

let EventEmitter = require('events').EventEmitter

const CAVE_TABLE = 'caves'

let old_state = {}
let state = {}
let cave_blacklist = {}

let CaveStore = Object.assign(new Store('cave-store'), {
  get_state: function () {
    state
  },

  find: function (cave_id) {
    return db.find_cave(cave_id)
  },

  find_for_game: function (game_id) {
    return db.find_cave_for_game(game_id)
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
  },

  log_path: function (cave_id) {
    return log_path(cave_id)
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
  if (err instanceof errors.Transition) {
    log(cave_opts(id), `[${task_name} => ${err.to}] ${err.reason || ''}`)
    let data = err.data || {}
    setImmediate(() => queue_task(id, err.to, data))
  } else if (err instanceof errors.InputRequired) {
    let msg = `(stub) input required by ${task_name}`
    log(cave_opts(id), msg)
    AppActions.cave_progress({id, task: 'error', error: msg})
  } else if (err instanceof errors.Crash) {
    let msg = `crashed with: ${JSON.stringify(err, null, 2)}`
    log(cave_opts(id), msg)
    AppActions.cave_progress({id, task: 'idle', error: msg, progress: 0})
  } else if (err instanceof errors.Cancelled) {
    queue_task(id, 'idle')
  } else {
    log(cave_opts(id), err.stack || err)
    AppActions.cave_progress({id, task: 'error', error: '' + err, progress: 0})
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
    AppActions.cave_progress({id, progress: 0})

    if (task_name === 'install') {
      let cave = await CaveStore.find(id)
      if (!cave.success_once) {
        let game = await db.find_game(cave.game_id)
        AppActions.notify(`${game.title} is ready!`)
        AppActions.cave_update(id, {success_once: true})
      }
    }

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
  let game = await db.find_game(record.game_id)
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

  if (await sf.exists(app_path)) {
    explorer.open(app_path)
  } else {
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

async function game_queue (payload) {
  let game_id = payload.game_id
  let cave = await db.find_cave_for_game(game_id)

  if (cave) {
    if (cave.launchable) {
      let game = await db.find_game(game_id)
      let action = classification_actions[game.classification]
      if (action === 'open') {
        AppActions.cave_explore(cave._id)
      } else {
        queue_task(cave._id, 'launch')
      }
    } else {
      let task = current_tasks[cave._id]
      if (task) {
        task.opts.emitter.emit('shine')
      } else {
        queue_task(cave._id, 'download')
      }
    }
  } else {
    queue_cave(game_id)
  }
}

async function cave_request_uninstall (payload) {
  let cave_id = payload.id
  let cave = await db.find_cave(cave_id)
  let game = await db.find_game(cave.game_id)

  let i18n = I18nStore.get_state()

  let buttons = [
    i18n.t('prompt.uninstall.uninstall'),
    i18n.t('prompt.uninstall.reinstall'),
    i18n.t('prompt.uninstall.cancel')
  ]
  let i18n_vars = {
    title: game.title
  }

  let dialog_opts = {
    type: 'question',
    buttons,
    message: i18n.t('prompt.uninstall.message', i18n_vars)
  }

  let callback = (response) => {
    if (response === 0) {
      AppActions.cave_queue_uninstall(payload.id)
    } else if (response === 1) {
      AppActions.cave_queue_reinstall(payload.id)
    }
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
}

async function cave_queue_uninstall (payload) {
  let cave_id = payload.id
  let record = await db.find_table(cave_id)

  if (record) {
    queue_task(record._id, 'uninstall')
  } else {
    log(store_opts, `asked to uninstall ${payload.id} but no record of it, ignoring`)
  }
}

async function cave_queue_reinstall (payload) {
  let cave_id = payload.id
  log(store_opts, `reinstalling ${cave_id}!`)
  queue_task(cave_id, 'install', {reinstall: true})
}

async function cave_update (payload) {
  let cave_id = payload.id
  let data = payload.data
  if (cave_blacklist[cave_id]) return
  await db.merge_one({_table: CAVE_TABLE, _id: cave_id}, data)
}

async function cave_implode (payload) {
  // don't accept any further updates to these caves, they're imploding.
  // useful in case child takes some time to exit after it receives SIGKILL
  cave_blacklist[payload.id] = true
  cave_cancel(payload)

  db.remove({_table: CAVE_TABLE, _id: payload.id})

  delete state[payload.id]
  emit_change()

  AppActions.cave_thrown_into_bit_bucket(payload.id)
}

function cave_cancel (payload) {
  let task = current_tasks[payload.id]
  if (task) {
    task.opts.emitter.emit('cancel')
    delete current_tasks[payload.id]
  }
}

async function authenticated (payload) {
  log(store_opts, `authenticated!`)
  let me = CredentialsStore.get_me()

  log(store_opts, `me = ${JSON.stringify(me, null, 2)}`)
  try {
    await db.load(me.id)
  } catch (e) {
    console.log(`error while db.loading: ${e.stack || e}`)
    require('../util/crash-reporter').handle(e)
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

function cancel_all_tasks () {
  for (let cave_id of Object.keys(current_tasks)) {
    let task = current_tasks[cave_id]
    if (!task) continue
    if (task) {
      task.opts.emitter.emit('cancel')
    }
  }
  current_tasks = {}
}

function logout (payload) {
  cancel_all_tasks()

  db.unload()
}

AppDispatcher.register('cave-store', Store.action_listeners(on => {
  on(AppConstants.GAME_QUEUE, game_queue)

  on(AppConstants.CAVE_REQUEST_UNINSTALL, cave_request_uninstall)
  on(AppConstants.CAVE_QUEUE_UNINSTALL, cave_queue_uninstall)
  on(AppConstants.CAVE_QUEUE_REINSTALL, cave_queue_reinstall)
  on(AppConstants.CAVE_UPDATE, cave_update)
  on(AppConstants.CAVE_IMPLODE, cave_implode)
  on(AppConstants.CAVE_CANCEL, cave_cancel)
  on(AppConstants.CAVE_PROGRESS, cave_progress)
  on(AppConstants.CAVE_EXPLORE, cave_explore)
  on(AppConstants.CAVE_PROBE, cave_probe)

  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOCATIONS_READY, locations_ready)
  on(AppConstants.LOGOUT, logout)
}))

module.exports = CaveStore
