
import app from 'app'
import path from 'path'

import assign from 'object-assign'
import deep_assign from 'deep-assign'

import defer from '../util/defer'
import {Logger} from '../util/log'
let log = require('../util/log')('install_store')

import db from '../util/db'

import {Transition, InputRequired, Deadend} from '../tasks/errors'

import AppDispatcher from '../dispatcher/app_dispatcher'
import AppConstants from '../constants/app_constants'

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
      case 'find_upload':
        throw new Transition({
          to: 'download',
          reason: 'natural transition'
        })
      case 'download':
        throw new Transition({
          to: 'extract',
          reason: 'natural transition'
        })
      case 'extract':
        throw new Transition({
          to: 'configure',
          reason: 'natural transition'
        })
      default:
        log(opts, `task ${task_name} finished with ${JSON.stringify(res)}`)
        if (task_opts.then) {
          queue_task(id, task_opts.then)
        } else {
          // pretty sure we should idle here
        }
    }
  }).catch((err) => {
    if (err instanceof Transition) {
      log(opts, `[${task_name} => ${err.to}] because ${err.reason}`)
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

// class AppInstall {
//
//   search_for_uploads () {
//     this.set_state(InstallState.SEARCHING_UPLOAD)
//
//     let client = AppStore.get_current_user()
//     let uploads = []
//     let upload_id
//     let id = this.id
//
//     db.find_one({_table: 'download_keys', game_id: this.game.id}).then((key) => {
//       console.log(`tried to find download key for ${this.game.id}, got ${JSON.stringify(key)}`)
//       if (key) {
//         return (
//           update_install(id, {key: key.id})
//           .then(() => client.download_key_uploads(key.id))
//         )
//       } else {
//         return client.game_uploads(this.game.id)
//       }
//     }).then((res) => {
//       uploads = res.uploads
//       return update_install(id, {uploads: indexBy(uploads, 'id')})
//     }).then(() => {
//       // filter uploads to find one relevant to our current platform
//       let prop = `p_${os.itch_platform()}`
//       let interesting_uploads = uploads.filter((upload) => !!upload[prop])
//
//       let scored_uploads = interesting_uploads.map((upload) => {
//         let score = 0
//         let filename = upload.filename.toLowerCase()
//
//         if (/\.zip$/.test(filename)) {
//           score += 10
//         }
//
//         if (/soundtrack/.test(filename)) {
//           score -= 100
//         }
//
//         return upload.merge({score})
//       })
//
//       scored_uploads = scored_uploads.sort((a, b) => (b.score - a.score))
//       console.log(`Scored uploads\n${JSON.stringify(scored_uploads)}`)
//
//       if (scored_uploads.length) {
//         // TODO let user choose if there's several viable uploads
//         upload_id = scored_uploads[0].id
//         return update_install(id, {upload_id})
//       } else {
//         throw new Error('No uploads found')
//       }
//     }).then(() => {
//       console.log(`Found upload, calling download task`)
//       return download.download(id, {
//         logger,
//         onprogress: (state) => {
//           this.progress = state.percent * 0.01
//           this.emit_change()
//         }
//       })
//     }).then(() => {
//       console.log(`Done downloading! woo!`)
//       defer(() => { this.extract() })
//     }).catch((err) => {
//       if (err instanceof Transition) {
//         console.log(`Transition to '${err.to}' because '${err.reason}'`)
//         switch (err.to) {
//           case 'find_upload':
//             defer(() => { this.search_for_uploads() })
//             break
//           case 'extract':
//             defer(() => { this.extract() })
//             break
//           default:
//             throw new Error(`Transition to unknown task: ${err.to}`)
//         }
//         return
//       }
//       this.error = `Could not download: ${err}`
//       console.log(this.error)
//       console.log(err.stack)
//       this.set_state(InstallState.ERROR)
//     })
//   }
//
//   extract () {
//     this.set_state(InstallState.EXTRACTING)
//
//     get_install(this.id).then((install) => {
//       let extract_opts = {
//         archive_path: archive_path(install.upload_id),
//         dest_path: app_path(this.id),
//         logger: this.logger,
//         onprogress: (state) => {
//           this.progress = 0.01 * state.percent
//           this.emit_change()
//         }
//       }
//       return extract.extract(extract_opts)
//     }).then((res) => {
//       console.log(`Extracted ${res.total_size} bytes total`)
//       this.set_state(InstallState.IDLE)
//     }).catch((e) => {
//       this.error = 'Failed to extract'
//       console.log(this.error)
//       console.log(e)
//       this.set_state(InstallState.ERROR)
//       AppActions.notify(`Failed to extract ${this.game.title}`)
//     }).finally(() => {
//       this.progress = 0
//       this.emit_change()
//     })
//   }
//
//   configure () {
//     this.set_state(InstallState.CONFIGURING)
//
//     configure.configure(this.app_path).then((res) => {
//       this.executables = res.executables
//       if (this.executables.length > 0) {
//         console.log('Configuration successful')
//         defer(() => this.launch())
//       } else {
//         this.error = 'No executables found'
//         console.log(this.error)
//         this.set_state(InstallState.ERROR)
//         AppActions.notify(`Failed to configure ${this.game.title}`)
//       }
//     })
//   }
//
//   launch () {
//     this.set_state(InstallState.RUNNING)
//     console.log(`Launching ${this.game.title}, ${this.executables.length} available`)
//
//     // try to launch top-most executable
//     let candidates = this.executables.map((orig_path) => {
//       let exec_path = path.normalize(orig_path)
//       return {
//         exec_path,
//         depth: exec_path.split(path.sep).length
//       }
//     })
//
//     candidates.sort((a, b) => a.depth - b.depth)
//
//     log(opts, `choosing ${candidates[0].exec_path} out of candidates\n ${JSON.stringify(candidates)}`)
//
//     launch.launch(candidates[0].exec_path).then((res) => {
//       log(opts, res)
//       AppActions.notify(res)
//     }).catch((e) => {
//       let msg = `${this.game.title} crashed with code ${e.code}`
//       log(opts, msg)
//       log(opts, `...executable path: ${e.exe_path}`)
//       AppActions.notify(msg)
//     }).finally(() => {
//       this.set_state(InstallState.IDLE)
//     })
//   }
// }

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
        // load existing installs
        db.find({_table: 'installs'}).then((records) => {
          for (let record of records) {
            queue_task(record._id, 'download')
          }
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
