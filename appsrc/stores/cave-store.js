
import { throttle, findWhere, each } from 'underline'

const AppDispatcher = require('../dispatcher/app-dispatcher')
const AppActions = require('../actions/app-actions')
const AppConstants = require('../constants/app-constants')
const classification_actions = require('../constants/classification-actions')

const Store = require('./store')
const CredentialsStore = require('./credentials-store')
const PreferencesStore = require('./preferences-store')
const InstallLocationStore = require('./install-location-store')
const I18nStore = require('./i18n-store')

const errors = require('../tasks/errors')

const path = require('path')
const deep = require('deep-diff')
const clone = require('clone')
const uuid = require('node-uuid')

const Logger = require('../util/log').Logger
const log = require('../util/log')('cave-store')
const market = require('../util/market')
const os = require('../util/os')
const diego = require('../util/diego')
const explorer = require('../util/explorer')
const sf = require('../util/sf')

const electron = require('electron')

const EventEmitter = require('events').EventEmitter

let old_state = {}
let state = {}
let cave_blacklist = {}

let CaveStore = Object.assign(new Store('cave-store'), {
  get_state: function () {
    state
  },

  find: function (cave) {
    return market.get_entities('caves')[cave]
  },

  find_for_game: function (game_id) {
    return market.get_entities('caves')::findWhere({game_id: game_id})
  },

  install_location_dir: function (loc_name) {
    let loc_record = InstallLocationStore.get_location(loc_name || 'appdata')
    if (!loc_record) {
      throw new Error(`Unknown location: ${loc_name}`)
    }
    return loc_record.path

    post: { // eslint-disable-line
      typeof loc_record.path === 'string'
    }
  },

  archive_path: function (loc, upload) {
    pre: { // eslint-disable-line
      typeof loc === 'string'
      typeof upload === 'object'
    }

    let loc_dir = CaveStore.install_location_dir(loc)
    return path.join(loc_dir, 'archives', `${upload.id}${path.extname(upload.filename)}`)
  },

  app_path: function (loc, cave_id) {
    pre: { // eslint-disable-line
      typeof loc === 'string'
      typeof cave_id === 'string'
    }

    let loc_dir = CaveStore.install_location_dir(loc)
    return path.join(loc_dir, 'apps', cave_id)
  },

  log_path: function (cave_id) {
    pre: { // eslint-disable-line
      typeof cave_id === 'string'
    }

    return log_path(cave_id)
  }
})

function log_path (cave_id) {
  pre: { // eslint-disable-line
    typeof cave_id === 'string'
  }

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
  pre: { // eslint-disable-line
    typeof id === 'string'
  }

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
    log(cave_opts(id), `${task_name} cancelled!`)
    let cave = CaveStore.find(id)
    if (cave) {
      if (cave.launchable && cave.success_once) {
        queue_task(id, 'idle')
      } else {
        AppActions.implode_cave(id)
      }
    } else {
      // it's dead, Jim!
    }
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
  pre: { // eslint-disable-line
    typeof id === 'string'
    typeof task_name === 'string'
  }

  let running = true

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

    const task = require(`../tasks/${task_name}`)
    let emitter = Object.assign({}, EventEmitter.prototype)
    let task_opts = Object.assign({}, cave_opts(id), data, {
      id,
      emitter,
      onprogress: ((state) => {
        if (!running) return
        AppActions.cave_progress({id, progress: state.percent * 0.01, task: task_name})
      })::throttle(50)
    })
    log(cave_opts(id), `starting ${task_name}`)
    AppActions.cave_progress({id, progress: 0, task: task_name})

    set_current_task(id, {
      name: task_name,
      opts: task_opts
    })
    let res = await task.start(task_opts)
    running = false
    set_current_task(id, null)
    AppActions.cave_progress({id, progress: 0})

    if (task_name === 'install') {
      let cave = CaveStore.find(id)
      if (!cave.success_once) {
        let game = market.get_entities('games')[cave.game_id]
        AppActions.notify(`${game.title} is ready!`)
        AppActions.update_cave(id, {success_once: true})
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
    running = false
    set_current_task(id, null)
    handle_task_error(err, id, task_name)
  }
}

async function initial_progress (cave) {
  AppActions.cave_progress(cave)
}

async function queue_game_install (game) {
  market.save_all_entities({ entities: { games: { [game.id]: game } } })

  let install_location = PreferencesStore.get_state().default_install_location
  let cave = { id: uuid.v4(), game_id: game.id, install_location }
  market.save_all_entities({ entities: { caves: { [cave.id]: cave } } })

  diego.hire(cave_opts(cave.id))
  initial_progress(cave)
  queue_task(cave.id, 'download')
}

async function explore_cave (payload) {
  let cave = CaveStore.find(payload.id)
  let app_path = CaveStore.app_path(cave.install_location, payload.id)

  if (await sf.exists(app_path)) {
    explorer.open(app_path)
  } else {
    probe_cave(payload)
  }
}

function cave_progress (payload) {
  let id = payload.data.id
  if (cave_blacklist[id]) return

  let old_state = state[id] || {}
  let new_state = Object.assign({}, old_state, payload.data)

  let diff = deep.diff(old_state, new_state)
  if (!diff) return

  state[id] = new_state

  AppActions.cave_store_cave_diff(id, diff)
  CaveStore.emit_change()
}

async function probe_cave (payload) {
  electron.shell.openItem(log_path(payload.id))
}

async function queue_game (payload) {
  let game = payload.game
  let cave = CaveStore.find_for_game(game.id)

  if (cave) {
    if (cave.launchable) {
      let action = classification_actions[game.classification]
      if (action === 'open') {
        AppActions.explore_cave(cave.id)
      } else {
        queue_task(cave.id, 'launch')
      }
    } else {
      let task = current_tasks[cave.id]
      if (task) {
        task.opts.emitter.emit('shine')
      } else {
        queue_task(cave.id, 'download')
      }
    }
  } else {
    queue_game_install(game)
  }
}

async function request_cave_uninstall (payload) {
  let cave = CaveStore.find(payload.id)
  let game = market.get_entities('games')[cave.game_id]

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
    message: i18n.t('prompt.uninstall.message', i18n_vars),
    cancelId: 2
  }

  let callback = (response) => {
    if (response === 0) {
      AppActions.queue_cave_uninstall(payload.id)
    } else if (response === 1) {
      AppActions.queue_cave_reinstall(payload.id)
    }
  }
  electron.dialog.showMessageBox(dialog_opts, callback)
}

async function queue_cave_uninstall (payload) {
  let record = CaveStore.find(payload.id)

  if (record) {
    queue_task(record.id, 'uninstall')
  } else {
    log(store_opts, `asked to uninstall ${payload.id} but no record of it, ignoring`)
  }
}

async function queue_cave_reinstall (payload) {
  let cave = payload.id
  log(store_opts, `reinstalling ${cave}!`)
  queue_task(cave, 'install', {reinstall: true})
}

async function update_cave (payload) {
  let {id, cave} = payload
  if (cave_blacklist[id]) return
  market.save_all_entities({entities: {caves: {[id]: cave}}})
}

async function implode_cave (payload) {
  // don't accept any further updates to these caves, they're imploding.
  // useful in case child takes some time to exit after it receives SIGKILL
  cave_blacklist[payload.id] = true
  cancel_cave(payload)

  market.delete_all_entities({entities: {caves: [payload.id]}})

  delete state[payload.id]
  emit_change()

  AppActions.cave_thrown_into_bit_bucket(payload.id)
}

function cancel_cave (payload) {
  let task = current_tasks[payload.id]
  if (task && !task.cancelling) {
    task.cancelling = true
    task.opts.emitter.emit('cancel')
  }
}

async function authenticated (payload) {
  let me = CredentialsStore.get_me()

  try {
    await market.load(me.id)
  } catch (e) {
    console.log(`error while loading market: ${e.stack || e}`)
    require('../util/crash-reporter').handle(e)
    return
  }

  AppActions.ready_to_roll()
}

async function locations_ready (payload) {
  let caves = market.get_entities('caves')

  caves::each((record) => {
    initial_progress(record)
    queue_task(record.id, 'awaken')
  })
}

function cancel_all_tasks () {
  for (let cave of Object.keys(current_tasks)) {
    let task = current_tasks[cave]
    if (!task) continue
    if (task) {
      task.opts.emitter.emit('cancel')
    }
  }
  current_tasks = {}
}

function logout (payload) {
  cancel_all_tasks()
  market.unload()
}

AppDispatcher.register('cave-store', Store.action_listeners(on => {
  on(AppConstants.QUEUE_GAME, queue_game)

  on(AppConstants.REQUEST_CAVE_UNINSTALL, request_cave_uninstall)
  on(AppConstants.QUEUE_CAVE_UNINSTALL, queue_cave_uninstall)
  on(AppConstants.QUEUE_CAVE_REINSTALL, queue_cave_reinstall)
  on(AppConstants.UPDATE_CAVE, update_cave)
  on(AppConstants.IMPLODE_CAVE, implode_cave)
  on(AppConstants.CANCEL_CAVE, cancel_cave)
  on(AppConstants.CAVE_PROGRESS, cave_progress)
  on(AppConstants.EXPLORE_CAVE, explore_cave)
  on(AppConstants.PROBE_CAVE, probe_cave)

  on(AppConstants.AUTHENTICATED, authenticated)
  on(AppConstants.LOCATIONS_READY, locations_ready)
  on(AppConstants.LOGOUT, logout)
}))

module.exports = CaveStore
