
import app from 'app'
import path from 'path'

import keyMirror from 'keymirror'
import deep_assign from 'deep-assign'
import {indexBy} from 'underscore'

import os from '../util/os'
import log from '../util/log'
import defer from '../util/defer'

import db from '../db'

import download from '../tasks/download'
import extract from '../tasks/extract'
import configure from '../tasks/configure'
import launch from '../tasks/launch'
import {Transition} from '../tasks/errors'

import AppDispatcher from '../dispatcher/app_dispatcher'
import AppConstants from '../constants/app_constants'
import AppActions from '../actions/app_actions'
import AppStore from '../stores/app_store'

let InstallState = keyMirror({
  PENDING: null,
  SEARCHING_UPLOAD: null,
  DOWNLOADING: null,
  EXTRACTING: null,
  CONFIGURING: null,
  RUNNING: null,
  ERROR: null,
  IDLE: null
})

let library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')
let archives_dir = path.join(library_dir, 'archives')
let apps_dir = path.join(library_dir, 'apps')
let by_id = {}

function get_install (id) {
  console.log(`find_install(${id})`)
  return db.find_one({_table: 'installs', _id: id})
}

function update_install (id, opts) {
  console.log(`update_install(${id}, ${JSON.stringify(opts)})`)
  return get_install(id).then((install) => {
    let record = deep_assign({}, install, opts)
    console.log(`Updated record: ${JSON.stringify(record)}`)
    return db.update({_table: 'installs', _id: id}, record)
  })
}

function archive_path (upload_id) {
  return path.join(archives_dir, `${upload_id}.bin`)
}

function app_path (game_id) {
  return path.join(apps_dir, game_id)
}

class AppInstall {
  setup (opts) {
    let data = {
      _table: 'installs',
      game_id: opts.game.id,
      state: InstallState.PENDING
    }
    db.insert(data).then((record) => {
      this.load(record)
    })
  }

  load (record) {
    this.logger = new log.Logger()
    this.id = record._id
    by_id[this.id] = this
    this.game_id = record.game_id
    this.progress = 0

    db.find_one({_table: 'games', id: this.game_id}).then((game) => {
      this.game = game
      if (!game) throw new Error(`game not found: ${this.game_id}`)
      console.log(`found game: ${JSON.stringify(this.game)}`)
    }).then(() => {
      this.set_state(record.state)
      console.log(`Loaded install ${this.id} with state ${this.state}`)

      switch (this.state) {
        case InstallState.PENDING:
          defer(() => this.start())
          break
      }
    })
  }

  set_state (state) {
    console.log(`Install ${this.id}, [${this.state} -> ${state}]`)
    this.state = state
    this.emit_change()
  }

  emit_change () {
    defer(() => AppActions.install_progress(this))
  }

  start () {
    this.search_for_uploads()
  }

  search_for_uploads () {
    this.set_state(InstallState.SEARCHING_UPLOAD)

    let client = AppStore.get_current_user()
    let uploads = []
    let upload_id
    let id = this.id

    db.find_one({_table: 'download_keys', game_id: this.game.id}).then((key) => {
      console.log(`tried to find download key for ${this.game.id}, got ${JSON.stringify(key)}`)
      if (key) {
        return (
          update_install(id, {key: key.id})
          .then(() => client.download_key_uploads(key.id))
        )
      } else {
        return client.game_uploads(this.game.id)
      }
    }).then((res) => {
      uploads = res.uploads
      return update_install(id, {uploads: indexBy(uploads, 'id')})
    }).then(() => {
      // filter uploads to find one relevant to our current platform
      let prop = `p_${os.itch_platform()}`
      let interesting_uploads = uploads.filter((upload) => !!upload[prop])

      let scored_uploads = interesting_uploads.map((upload) => {
        let score = 0
        let filename = upload.filename.toLowerCase()

        if (/\.zip$/.test(filename)) {
          score += 10
        }

        if (/soundtrack/.test(filename)) {
          score -= 100
        }

        return upload.merge({score})
      })

      scored_uploads = scored_uploads.sort((a, b) => (b.score - a.score))
      console.log(`Scored uploads\n${JSON.stringify(scored_uploads)}`)

      if (scored_uploads.length) {
        // TODO let user choose if there's several viable uploads
        upload_id = scored_uploads[0].id
        return update_install(id, {upload_id})
      } else {
        throw new Error('No uploads found')
      }
    }).then(() => {
      console.log(`Found upload, calling download task`)
      return download.download(id, {
        logger: this.logger,
        onprogress: (state) => {
          this.progress = state.percent * 0.01
          this.emit_change()
        }
      })
    }).then(() => {
      console.log(`Done downloading! woo!`)
      defer(() => { this.extract() })
    }).catch((err) => {
      if (err instanceof Transition) {
        console.log(`Transition to '${err.to}' because '${err.reason}'`)
        switch (err.to) {
          case 'find_upload':
            defer(() => { this.search_for_uploads() })
            break
          case 'extract':
            defer(() => { this.extract() })
            break
          default:
            throw new Error(`Transition to unknown task: ${err.to}`)
        }
        return
      }
      this.error = `Could not download: ${err}`
      console.log(this.error)
      console.log(err.stack)
      this.set_state(InstallState.ERROR)
    })
  }

  extract () {
    this.set_state(InstallState.EXTRACTING)

    get_install(this.id).then((install) => {
      let opts = {
        archive_path: archive_path(install.upload_id),
        dest_path: app_path(this.id),
        logger: this.logger,
        onprogress: (state) => {
          this.progress = 0.01 * state.percent
          this.emit_change()
        }
      }
      return extract.extract(opts)
    }).then((res) => {
      console.log(`Extracted ${res.total_size} bytes total`)
      this.set_state(InstallState.IDLE)
    }).catch((e) => {
      this.error = 'Failed to extract'
      console.log(this.error)
      console.log(e)
      this.set_state(InstallState.ERROR)
      AppActions.notify(`Failed to extract ${this.game.title}`)
    }).finally(() => {
      this.progress = 0
      this.emit_change()
    })
  }

  configure () {
    this.set_state(InstallState.CONFIGURING)

    configure.configure(this.app_path).then((res) => {
      this.executables = res.executables
      if (this.executables.length > 0) {
        console.log('Configuration successful')
        defer(() => this.launch())
      } else {
        this.error = 'No executables found'
        console.log(this.error)
        this.set_state(InstallState.ERROR)
        AppActions.notify(`Failed to configure ${this.game.title}`)
      }
    })
  }

  launch () {
    this.set_state(InstallState.RUNNING)
    console.log(`Launching ${this.game.title}, ${this.executables.length} available`)

    // try to launch top-most executable
    let candidates = this.executables.map((orig_path) => {
      let exec_path = path.normalize(orig_path)
      return {
        exec_path,
        depth: exec_path.split(path.sep).length
      }
    })

    candidates.sort((a, b) => a.depth - b.depth)

    console.log(`choosing ${candidates[0].exec_path} out of candidates\n ${JSON.stringify(candidates)}`)

    launch.launch(candidates[0].exec_path).then((res) => {
      console.log(res)
      AppActions.notify(res)
    }).catch((e) => {
      let msg = `${this.game.title} crashed with code ${e.code}`
      console.log(msg)
      console.log(`...executable path: ${e.exe_path}`)
      AppActions.notify(msg)
    }).finally(() => {
      this.set_state(InstallState.IDLE)
    })
  }
}

function install () {
  AppDispatcher.register((action) => {
    switch (action.action_type) {
      case AppConstants.DOWNLOAD_QUEUE: {
        db.find_one({_table: 'installs', game_id: action.opts.game.id}).then((record) => {
          if (record) {
            let install = by_id[record._id]
            install.configure()
          } else {
            let install = new AppInstall()
            install.setup(action.opts)
          }
        })
        break
      }

      case AppConstants.LOGIN_DONE: {
        // load existing installs
        db.find({_table: 'installs'}).then((records) => {
          for (let record of records) {
            let install = new AppInstall()
            install.load(record)
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
  update_install,
  archive_path,
  app_path
}
