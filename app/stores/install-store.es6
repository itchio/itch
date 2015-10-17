
import app from 'app'
import path from 'path'

import assign from 'object-assign'
import deep_assign from 'deep-assign'

import {Logger} from '../util/log'
let log = require('../util/log')('install-store')

import db from '../util/db'

import {Transition, InputRequired} from '../tasks/errors'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'

let library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')
let archives_dir = path.join(library_dir, 'archives')
let apps_dir = path.join(library_dir, 'apps')

let logger = new Logger()
let opts = {logger}

let self = {
  get_install: function (id) {
    return db.find_one({_table: 'installs', _id: id})
  },

  get_install_for_game: function (game_id) {
    return db.find_one({_table: 'installs', game_id: game_id})
  },

  update_install: function (id, opts) {
    log(opts, `update_install(${id}, ${JSON.stringify(opts)})`)
    return self.get_install(id).then((install) => {
      let record = deep_assign({}, install, opts)
      return db.update({_table: 'installs', _id: id}, record)
    })
  },

  archive_path: function (upload_id) {
    return path.join(archives_dir, `${upload_id}.bin`)
  },

  app_path: function (install_id) {
    return path.join(apps_dir, install_id)
  },

  queue_install: function (game_id) {
    let data = {
      _table: 'installs',
      game_id
    }
    db.insert(data).then((record) => {
      self.queue_task(record._id, 'download', opts)
    })
  },

  natural_transitions: {
    'find-upload': 'download',
    'download': 'extract',
    'extract': 'configure'
  },

  queue_task: function (id, task_name, data = {}) {
    let task = require(`../tasks/${task_name}`)
    let task_opts = assign({}, opts, data, {
      id,
      onprogress: (state) => {
        log(opts, `${task_name} done ${state.percent}%`)
      }
    })
    log(opts, `starting ${task_name}`)
    task.start(task_opts).then((res) => {
      let transition = self.natural_transitions[task_name]
      if (transition) throw new Transition({to: transition})

      log(opts, `task ${task_name} finished with ${JSON.stringify(res)}`)
      if (task_opts.then) {
        self.queue_task(id, task_opts.then)
      }
    }).catch((err) => {
      if (err instanceof Transition) {
        log(opts, `[${task_name} => ${err.to}] ${err.reason}`)
        let data = err.data || {}
        self.queue_task(id, err.to, data)
      } else if (err instanceof InputRequired) {
        log(opts, `(stub) input required by ${task_name}`)
      } else {
        if (err.stack) {
          log(opts, err.stack)
        }
        throw err
      }
    })
  },

  install: function () {
    AppDispatcher.register((action) => {
      switch (action.action_type) {
        case AppConstants.DOWNLOAD_QUEUE: {
          db.find_one({_table: 'installs', game_id: action.opts.game.id}).then((record) => {
            if (record) {
              self.queue_task(record._id, 'launch')
            } else {
              self.queue_install(action.opts.game.id)
            }
          })
          break
        }

        case AppConstants.AUTHENTICATED: {
          db.load().then(_ => {
            // load existing installs
            db.find({_table: 'installs'}).then(records => {
              for (let record of records) {
                self.queue_task(record._id, 'download')
              }
            })
          })
          break
        }
      }
    })
  }
}

export default self
