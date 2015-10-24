
import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'
import Store from './store'

import {Transition, InputRequired, Crash} from '../tasks/errors'

import app from 'app'
import path from 'path'

import {Logger} from '../util/log'
let log = require('../util/log')('install-store')
import db from '../util/db'

let library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')
let archives_dir = path.join(library_dir, 'archives')
let apps_dir = path.join(library_dir, 'apps')

let logger = new Logger()
let opts = {logger}

let InstallStore = Object.assign(new Store('install-store'), {
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
      setImmediate(() => queue_task(id, err.to, data))
    } else if (err instanceof InputRequired) {
      let msg = `(stub) input required by ${task_name}`
      log(opts, msg)
      AppActions.install_progress({id, task: 'error', error: msg})
    } else if (err instanceof Crash) {
      let msg = `crashed with: ${JSON.stringify(err, null, 2)}`
      log(opts, msg)
      AppActions.install_progress({id, task: 'idle', error: msg})
    } else {
      log(opts, err.stack || err)
      AppActions.install_progress({id, task: 'error', error: '' + err})
    }
  }
}

function queue_task (id, task_name, data = {}) {
  let task = require(`../tasks/${task_name}`)
  let task_opts = Object.assign({}, opts, data, {
    id,
    onprogress: (state) => {
      AppActions.install_progress({id, progress: state.percent * 0.01, task: task_name})
    }
  })
  log(opts, `starting ${task_name}`)

  AppActions.install_progress({id, progress: 0, task: task_name})
  task.start(task_opts)
    .then((res) => {
      if (task_name === 'extract') {
        db.find_one({_table: 'installs', _id: id}).then((install) => {
          if (!install.success_once) {
            return db.find_one({_table: 'games', id: install.game_id}).then((game) => {
              AppActions.notify(`${game.title} is ready!`)
              AppActions.install_update(id, {success_once: true})
            })
          }
        })
      }

      let transition = natural_transitions[task_name]
      if (transition) throw new Transition({to: transition})

      log(opts, `task ${task_name} finished with ${JSON.stringify(res)}`)
      AppActions.install_progress({id, progress: 0})
    })
    .then(() => {
      if (task_opts.then) {
        queue_task(id, task_opts.then)
      } else {
        AppActions.install_progress({id, task: 'idle'})
      }
    })
    .catch(task_error_handler(id, task_name))
}

function initial_progress (record) {
  AppActions.install_progress(Object.assign({id: record._id}, record))
  db.find_one({_table: 'games', id: record.game_id}).then(game => {
    AppActions.install_progress({id: record._id, game})
  })
}

function queue_install (game_id) {
  let data = { _table: 'installs', game_id }
  db.insert(data).then((record) => {
    db.find_one({_table: 'games', id: game_id}).then((game) => {
      initial_progress(record)
      queue_task(record._id, 'download', opts)
    })
  })
}

function update_install (_id, data) {
  return db.merge_one({_table: 'installs', _id}, data)
}

AppDispatcher.register('install-store', Store.action_listeners(on => {
  on(AppConstants.INSTALL_QUEUE, action => {
    db.find_one({_table: 'installs', game_id: action.game_id}).then((record) => {
      if (record) {
        if (record.launchable) {
          queue_task(record._id, 'launch')
        }
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
      .each((record, i) => {
        initial_progress(record)
        setTimeout(() => {
          queue_task(record._id, 'download')
        }, i * 250)
      })
    )
  })
}))

export default InstallStore
