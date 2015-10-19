
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'
import Store from './store'

import {Transition, InputRequired} from '../tasks/errors'

import app from 'app'
import path from 'path'

import deep_assign from 'deep-assign'

import {Logger} from '../util/log'
let log = require('../util/log')('install-store')
import db from '../util/db'

let library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')
let archives_dir = path.join(library_dir, 'archives')
let apps_dir = path.join(library_dir, 'apps')

let logger = new Logger()
let opts = {logger}

let InstallStore = Object.assign(new Store(), {
  get_install: function (id) {
    return db.find_one({_table: 'installs', _id: id})
  },

  get_install_for_game: function (game_id) {
    return db.find_one({_table: 'installs', game_id: game_id})
  },

  archive_path: function (upload_id) {
    return path.join(archives_dir, `${upload_id}.bin`)
  },

  app_path: function (install_id) {
    return path.join(apps_dir, install_id)
  }
})

let natural_transitions = {
  'find-upload': 'download',
  'download': 'extract',
  'extract': 'configure'
}

function task_error_handler (id, task_name) {
  return function (err) {
    if (err instanceof Transition) {
      log(opts, `[${task_name} => ${err.to}] ${err.reason}`)
      let data = err.data || {}
      queue_task(id, err.to, data)
    } else if (err instanceof InputRequired) {
      let msg = `(stub) input required by ${task_name}`
      log(opts, msg)
      AppActions.install_progress({id, task: 'error', error: msg})
    } else {
      log(opts, err.stack || err)
      AppActions.install_progress({id, task: 'error', error: '' + err})
      throw err
    }
  }
}

function queue_task (id, task_name, data = {}) {
  let task = require(`../tasks/${task_name}`)
  let task_opts = Object.assign({}, opts, data, {
    id,
    onprogress: (state) => {
      log(opts, `${task_name} done ${state.percent}%`)
      AppActions.install_progress({id, progress: state.percent * 0.01, task: task_name})
    }
  })
  log(opts, `starting ${task_name}`)
  AppActions.install_progress({id, progress: 0, task: task_name})
  task.start(task_opts).then((res) => {
    let transition = natural_transitions[task_name]
    if (transition) throw new Transition({to: transition})

    log(opts, `task ${task_name} finished with ${JSON.stringify(res)}`)
    if (task_opts.then) {
      queue_task(id, task_opts.then)
    } else {
      AppActions.install_progress({id, progress: 0, task: 'idle'})
    }
  }).catch(task_error_handler(id, task_name))
}

function initial_progress (game, record) {
  AppActions.install_progress(Object.assign({game, id: record._id}, record))
}

function queue_install (game_id) {
  let data = { _table: 'installs', game_id }
  db.insert(data).then((record) => {
    db.find_one({_table: 'games', id: game_id}).then((game) => {
      initial_progress(game, record)
      queue_task(record._id, 'download', opts)
    })
  })
}

function update_install (id, data) {
  log(opts, `update_install(${id}, ${JSON.stringify(data, null, 2)})`)
  return InstallStore.get_install(id).then((install) => {
    let record = deep_assign({}, install, data)
    return db.update({_table: 'installs', _id: id}, record)
  })
}

InstallStore.dispatch_token = AppDispatcher.register(Store.action_listeners(on => {
  on(AppConstants.INSTALL_QUEUE, action => {
    db.find_one({_table: 'installs', game_id: action.game_id}).then((record) => {
      if (record) {
        queue_task(record._id, 'configure', {then: 'launch'})
      } else {
        queue_install(action.game_id)
      }
    })
  })

  on(AppConstants.INSTALL_UPDATE, action => {
    return update_install(action.id, action.data)
  })

  on(AppConstants.AUTHENTICATED, action => {
    return (
      db.load()
      .then(() => db.find({_table: 'installs'}))
      .each(record => {
        db.find_one({_table: 'games', id: record.game_id}).then((game) => {
          initial_progress(game, record)
          queue_task(record._id, 'download')
        })
      })
    )
  })
}))

export default InstallStore
