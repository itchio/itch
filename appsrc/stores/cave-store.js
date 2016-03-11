
import {throttle, findWhere, each} from 'underline'
import {diff} from 'grovel'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'
import classification_actions from '../constants/classification-actions'

import Store from './store'
import CredentialsStore from './credentials-store'
import PreferencesStore from './preferences-store'
import InstallLocationStore from './install-location-store'
import I18nStore from './i18n-store'

import {Transition, Cancelled, InputRequired, Crash} from '../tasks/errors'

import path from 'path'
import clone from 'clone'
import uuid from 'node-uuid'

import {Logger} from '../util/log'
import mklog from '../util/log'
const log = mklog('cave-store')
import market from '../util/market'
import os from '../util/os'
import diego from '../util/diego'
import explorer from '../util/explorer'
import sf from '../util/sf'

import electron from 'electron'

import {EventEmitter} from 'events'

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
    pre: { // eslint-disable-line
      !loc_name || typeof loc_name === 'string'
    }

    let loc_record = InstallLocationStore.get_location(loc_name || 'appdata')
    if (!loc_record) {
      throw new Error(`Unknown location: ${loc_name}`)
    }
    return loc_record.path

    post: { // eslint-disable-line
      typeof loc_record.path === 'string'
    }
  },

  archivePath: function (loc_name, upload) {
    pre: { // eslint-disable-line
      typeof upload === 'object'
    }

    let loc_dir = CaveStore.install_location_dir(loc_name)
    return path.join(loc_dir, 'archives', `${upload.id}${path.extname(upload.filename)}`)
  },

  appPath: function (loc_name, cave_id) {
    pre: { // eslint-disable-line
      typeof cave_id === 'string'
    }

    let loc_dir = CaveStore.install_location_dir(loc_name)
    return path.join(loc_dir, 'apps', cave_id)
  },

  logPath: function (cave_id) {
    pre: { // eslint-disable-line
      typeof cave_id === 'string'
    }

    return logPath(cave_id)
  }
})

function logPath (cave_id) {
  pre: { // eslint-disable-line
    typeof cave_id === 'string'
  }

  let loc_dir = CaveStore.install_location_dir('appdata')
  return path.join(loc_dir, 'logs', cave_id + '.txt')
}

function emit_change () {
  let new_state = state
  let state_diff = old_state::diff(new_state)

  if (!state_diff) return
  old_state = clone(state)
  AppActions.cave_store_diff(state_diff)

  CaveStore.emit_change()
}

let storeOpts = {
  logger: new Logger()
}

let caveOpts_cache = {}

function caveOpts (id) {
  pre: { // eslint-disable-line
    typeof id === 'string'
  }

  let cached = caveOpts_cache[id]
  if (cached) return cached

  let logger = new Logger({
    sinks: {
      console: false,
      file: logPath(id)
    }
  })
  let opts = {logger}
  caveOpts_cache[id] = opts

  log(opts, `~~~~~~~~~~~~~~~~ the village awakens ~~~~~~~~~~~~~~~~`)
  log(opts, `itch v${electron.app.getVersion()} to ground control, on ${os.itch_platform()}-${os.arch()}`)

  return opts
}

function handle_task_error (err, id, task_name) {
  if (err instanceof Transition) {
    log(caveOpts(id), `[${task_name} => ${err.to}] ${err.reason || ''}`)
    let data = err.data || {}
    setImmediate(() => queue_task(id, err.to, data))
  } else if (err instanceof InputRequired) {
    let msg = `(stub) input required by ${task_name}`
    log(caveOpts(id), msg)
    AppActions.cave_progress({id, task: 'error', error: msg})
  } else if (err instanceof Crash) {
    let msg = `crashed with: ${JSON.stringify(err, null, 2)}`
    log(caveOpts(id), msg)
    AppActions.cave_progress({id, task: 'idle', error: msg, progress: 0})
  } else if (err instanceof Cancelled) {
    log(caveOpts(id), `${task_name} cancelled!`)
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
    log(caveOpts(id), err.stack || err)
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
      log(caveOpts(id), `task already in progress for ${id}, ignoring ${task_name} request`)
      return
    }

    if (task_name === 'download' && num_downloads() >= max_downloads) {
      queue_task(id, 'download-queued')
      return
    }

    const task = require(`../tasks/${task_name}`).default
    let emitter = Object.assign({}, EventEmitter.prototype)
    let taskOpts = Object.assign({}, caveOpts(id), data, {
      id,
      emitter,
      onProgress: ((state) => {
        if (!running) return
        AppActions.cave_progress({id, progress: state.percent * 0.01, task: task_name})
      })::throttle(50)
    })
    log(caveOpts(id), `starting ${task_name}`)
    AppActions.cave_progress({id, progress: 0, task: task_name})

    set_current_task(id, {
      name: task_name,
      opts: taskOpts
    })
    let res = await task.start(taskOpts)
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

    log(caveOpts(id), `task ${task_name} finished with ${JSON.stringify(res)}`)
    if (task_name === 'uninstall') return

    AppActions.cave_progress({id, progress: 0})

    if (taskOpts.then) {
      queue_task(id, taskOpts.then)
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
  market.save_all_entities({entities: {games: {[game.id]: game}}})

  let install_location = PreferencesStore.get_state().default_install_location
  let cave = {id: uuid.v4(), game_id: game.id, install_location}
  market.save_all_entities({entities: {caves: {[cave.id]: cave}}})

  diego.hire(caveOpts(cave.id))
  initial_progress(cave)
  queue_task(cave.id, 'download')
}

async function explore_cave (payload) {
  let cave = CaveStore.find(payload.id)
  let appPath = CaveStore.appPath(cave.install_location, payload.id)

  if (await sf.exists(appPath)) {
    explorer.open(appPath)
  } else {
    probe_cave(payload)
  }
}

function cave_progress (payload) {
  let id = payload.data.id
  if (cave_blacklist[id]) return

  let old_state = state[id] || {}
  let new_state = Object.assign({}, old_state, payload.data)

  let cave_diff = old_state::diff(new_state)
  if (!cave_diff) return

  state[id] = new_state

  AppActions.cave_store_cave_diff(id, cave_diff)
  CaveStore.emit_change()
}

async function probe_cave (payload) {
  electron.shell.openItem(logPath(payload.id))
}

async function queue_game (payload) {
  const game = payload.game
  const cave = CaveStore.find_for_game(game.id)

  if (cave) {
    if (cave.launchable) {
      let action = classification_actions[game.classification]
      if (action === 'open') {
        AppActions.record_game_interaction(game.id, 'open')
        AppActions.explore_cave(cave.id)
      } else {
        AppActions.record_game_interaction(game.id, 'launch')
        queue_task(cave.id, 'launch')
      }
    } else {
      let task = current_tasks[cave.id]
      if (task) {
        task.opts.emitter.emit('shine')
      } else {
        AppActions.record_game_interaction(game.id, 'download')
        queue_task(cave.id, 'download')
      }
    }
  } else {
    queue_game_install(game)
  }
}

async function request_cave_uninstall (payload) {
  const cave = CaveStore.find(payload.id)
  const game = market.get_entities('games')[cave.game_id]

  const i18n = I18nStore.get_state()

  const buttons = [
    i18n.t('prompt.uninstall.uninstall'),
    i18n.t('prompt.uninstall.reinstall'),
    i18n.t('prompt.uninstall.cancel')
  ]
  const i18n_vars = {
    title: game.title
  }

  const dialogOpts = {
    type: 'question',
    buttons,
    message: i18n.t('prompt.uninstall.message', i18n_vars),
    cancelId: 2
  }

  const callback = (response) => {
    if (response === 0) {
      AppActions.queue_cave_uninstall(payload.id)
    } else if (response === 1) {
      AppActions.queue_cave_reinstall(payload.id)
    }
  }
  electron.dialog.showMessageBox(dialogOpts, callback)
}

async function queue_cave_uninstall (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.id === 'string'
  }

  const record = CaveStore.find(payload.id)

  if (record) {
    queue_task(record.id, 'uninstall')
  } else {
    log(storeOpts, `asked to uninstall ${payload.id} but no record of it, ignoring`)
  }
}

async function queue_cave_reinstall (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.id === 'string'
  }

  const cave_id = payload.id
  log(storeOpts, `reinstalling ${cave_id}!`)
  queue_task(cave_id, 'install', {reinstall: true})
}

async function update_cave (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.id === 'string'
    typeof payload.cave === 'object'
  }

  const {id, cave} = payload
  if (cave_blacklist[id]) {
    return
  }
  market.save_all_entities({entities: {caves: {[id]: cave}}})
}

async function implode_cave (payload) {
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.id === 'string'
  }

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
  pre: { // eslint-disable-line
    typeof payload === 'object'
    typeof payload.id === 'string'
  }

  const task = current_tasks[payload.id]
  if (task && !task.cancelling) {
    task.cancelling = true
    task.opts.emitter.emit('cancel')
  }
}

async function authenticated (payload) {
  const me = CredentialsStore.get_me()

  try {
    await market.load(me.id)
  } catch (e) {
    console.log(`error while loading market: ${e.stack || e}`)
    require('../util/crash-reporter').default.handle(e)
    return
  }

  AppActions.ready_to_roll()
}

async function locations_ready (payload) {
  const caves = market.get_entities('caves')

  caves::each((record) => {
    initial_progress(record)
    queue_task(record.id, 'awaken')
  })
}

function cancel_all_tasks () {
  for (let cave of Object.keys(current_tasks)) {
    const task = current_tasks[cave]
    delete current_tasks[cave]

    if (!task) {
      continue
    }
    task.opts.emitter.emit('cancel')
  }
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

export default CaveStore
