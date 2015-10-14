
import app from 'app'
import path from 'path'

import assign from 'object-assign'
import deep_assign from 'deep-assign'

import defer from '../util/defer'
import {Logger} from '../util/log'
let log = require('../util/log')('install-store')

import db from '../util/db'

import {Transition, InputRequired, Deadend} from '../tasks/errors'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'

let library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')
let archives_dir = path.join(library_dir, 'archives')
let apps_dir = path.join(library_dir, 'apps')

let logger = new Logger()
let opts = {logger}

function get_install (id) {
  return db.find_one({_table: 'installs', _id: id})
}

function get_install_for_game (game_id) {
  return db.find_one({_table: 'installs', game_id: game_id})
}

function update_install (id, opts) {
  log(opts, `update_install(${id}, ${JSON.stringify(opts)})`)
  return get_install(id).then((install) => {
    let record = deep_assign({}, install, opts)
    return db.update({_table: 'installs', _id: id}, record)
  })
}

function archive_path (upload_id) {
  return path.join(archives_dir, `${upload_id}.bin`)
}

function app_path (install_id) {
  return path.join(apps_dir, install_id)
}

function queue_install (game_id) {
  let data = {
    _table: 'installs',
    game_id
  }
  db.insert(data).then((record) => {
    queue_task(record._id, 'download', opts)
  })
}

function queue_task (id, task_name, data = {}) {
  let task = require(`../tasks/${task_name}`)
  let task_opts = assign({}, opts, data, {
    id,
    onprogress: (state) => {
      log(opts, `${task_name} done ${state.percent}%`)
    }
  })
  log(opts, `starting ${task_name}`)
  task.start(task_opts).then((res) => {
    switch (task_name) {
      case 'find-upload':
        throw new Transition({ to: 'download' })
      case 'download':
        throw new Transition({ to: 'extract' })
      case 'extract':
        throw new Transition({ to: 'configure' })
      default:
        log(opts, `task ${task_name} finished with ${JSON.stringify(res)}`)
        if (task_opts.then) {
          queue_task(id, task_opts.then)
        }
    }
  }).catch((err) => {
    if (err instanceof Transition) {
      log(opts, `[${task_name} => ${err.to}] ${err.reason}`)
      let {data} = err.data || {}
      defer(() => queue_task(id, err.to, data))
    } else if (err instanceof InputRequired) {
      log(opts, `(stub) input required by ${task_name}`)
    } else if (err instanceof Deadend) {
      log(opts, `deadend for ${task_name} because ${err.reason}`)
    } else {
      if (err.stack) {
        console.log(err.stack)
      }
      throw err
    }
  })
}

function install () {
  AppDispatcher.register((action) => {
    switch (action.action_type) {
      case AppConstants.DOWNLOAD_QUEUE: {
        db.find_one({_table: 'installs', game_id: action.opts.game.id}).then((record) => {
          if (record) {
            queue_task(record._id, 'launch')
          } else {
            queue_install(action.opts.game.id)
          }
        })
        break
      }

      case AppConstants.LOGIN_DONE: {
        db.loadDatabase(err => {
          if (err) {
            console.log(`Couldn't restore database: ${err}`)
            return
          }

          // load existing installs
          db.find({_table: 'installs'}).then((records) => {
            for (let record of records) {
              queue_task(record._id, 'download')
            }
          })
        })
        break
      }
    }
  })
}

export default {
  install,
  get_install,
  get_install_for_game,
  update_install,
  archive_path,
  app_path
}
