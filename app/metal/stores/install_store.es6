
import app from 'app'
import path from 'path'
import fs from 'fs'

import request from 'request'
import progress from 'request-progress'
import mkdirp from 'mkdirp'
import Humanize from 'humanize-plus'

import keyMirror from 'keymirror'

import defer from '../defer'
import fileutils from '../fileutils'
import db from '../db'

import extractor from '../extractor'
import configurator from '../configurator'
import launcher from '../launcher'

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

class AppInstall {
  setup (opts) {
    let data = {
      _table: 'installs',
      game_id: opts.game.id,
      state: InstallState.PENDING
    }
    db.insert(data).then((record) => this.load(record))
  }

  load (record) {
    this.id = record._id
    AppInstall.by_id[this.id] = this
    this.game_id = record.game_id
    this.progress = 0

    db.find_one({_table: 'games', id: this.game_id}).then((game) => {
      this.game = game
      if (!game) throw new Error(`game not found: ${this.game_id}`)
      console.log(`found game: ${JSON.stringify(this.game)}`)
    }).then(() => {
      return this.app_path || db.find_one({_table: 'users', id: this.game.user_id}).then((user) => {
        console.log(`found user: ${JSON.stringify(user)}`)
        let {username} = user
        let slug = this.game.url.match(/[^\/]+$/)
        this.app_path = path.join(AppInstall.apps_dir, `${slug}-by-${username}`)
      })
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

    db.find_one({_table: 'download_keys', game_id: this.game.id}).then((key) => {
      console.log(`tried to find download key for ${this.game.id}, got ${JSON.stringify(key)}`)
      if (key) {
        this.key = key
        return client.download_key_uploads(this.key.id)
      } else {
        return client.game_uploads(this.game.id)
      }
    }).then((res) => {
      let { uploads } = res

      // filter uploads to find one relevant to our current platform
      let prop

      switch (process.platform) {
        case 'darwin':
          prop = 'p_osx'
          break
        case 'win32':
          prop = 'p_windows'
          break
        case 'linux':
          prop = 'p_linux'
          break
      }

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
        // TODO let user choose
        this.set_upload(scored_uploads[0])
      } else {
        this.error = 'No uploads found'
        console.log(this.error)
        this.set_state(InstallState.ERROR)
      }
    }).catch((err) => {
      this.error = `Could not download: ${err}`
      console.log(this.error)
      console.log(err.stack)
      this.set_state(InstallState.ERROR)
    })
  }

  set_upload (upload) {
    this.upload = upload
    console.log(`Choosing to download ${this.upload.filename}`)

    let ext = fileutils.ext(this.upload.filename)
    let archive_name = `upload-${this.upload.id}${ext}`
    this.archive_path = path.join(AppInstall.archives_dir, archive_name)
    this.get_url()
  }

  get_url () {
    this.set_state(InstallState.DOWNLOADING)

    let client = AppStore.get_current_user()

    ;(this.key
    ? client.download_upload_with_key(this.key.id, this.upload.id)
    : client.download_upload(this.upload.id)).then((res) => {
      this.url = res.url
      defer(() => this.download())
    }).catch((err) => {
      this.error = `Could not download: ${err}`
      console.log(this.error)
      console.log(err.stack)
      this.set_state(InstallState.ERROR)
    })
  }

  download () {
    this.set_state(InstallState.DOWNLOADING)

    let headers = {}
    let flags = 'w'

    if (this.local_size) {
      headers['Range'] = `bytes=${this.local_size}-`
      flags = 'a'
    } else if (fs.existsSync(this.archive_path)) {
      console.log(`Have existing archive at ${this.archive_path}, checking size`)

      request.head(this.url).on('response', (response) => {
        let content_length = response.headers['content-length']
        let stats = fs.lstatSync(this.archive_path)
        console.log(`${Humanize.fileSize(content_length)} (remote file size)`)
        console.log(`${Humanize.fileSize(stats.size)} (local file size)`)
        let diff = content_length - stats.size

        if (diff > 0) {
          console.log(`Should download remaining ${Humanize.fileSize(diff)} bytes.`)
          this.local_size = stats.size
          this.get_url()
        } else {
          console.log('All good.')
          defer(() => this.extract())
        }
      })

      return
    }

    console.log(`Downloading with headers ${JSON.stringify(headers)}, flags = ${flags}`)
    let r = progress(request.get({
      encoding: null, // binary (otherwise defaults to utf-8)
      url: this.url,
      headers
    }), {throttle: 25})

    r.on('response', (response) => {
      console.log(`Got status code: ${response.statusCode}`)
      let content_length = response.headers['content-length']
      console.log(`Downloading ${Humanize.fileSize(content_length)} for ${this.game.title}`)
    })

    r.on('error', (err) => {
      console.log(`Download error: ${JSON.stringify(err)}`)
    })

    r.on('progress', (state) => {
      this.progress = 0.01 * state.percent
      this.emit_change()
    })

    mkdirp.sync(path.dirname(this.archive_path))
    let dst = fs.createWriteStream(this.archive_path, {
      flags,
      defaultEncoding: 'binary'
    })
    r.pipe(dst).on('close', () => {
      this.progress = 0
      this.emit_change()

      AppActions.bounce()
      AppActions.notify(`${this.game.title} finished downloading.`)
      defer(() => this.extract())
    })
  }

  extract () {
    this.set_state(InstallState.EXTRACTING)

    extractor.extract(this.archive_path, this.app_path).progress((state) => {
      this.progress = 0.01 * state.percent
      this.emit_change()
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

    configurator.configure(this.app_path).then((res) => {
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

    launcher.launch(candidates[0].exec_path).then((res) => {
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

AppInstall.library_dir = path.join(app.getPath('home'), 'Downloads', 'itch.io')
AppInstall.archives_dir = path.join(AppInstall.library_dir, 'archives')
AppInstall.apps_dir = path.join(AppInstall.library_dir, 'apps')
AppInstall.by_id = {}

export function install () {
  AppDispatcher.register((action) => {
    switch (action.action_type) {
      case AppConstants.DOWNLOAD_QUEUE: {
        db.find_one({_table: 'installs', game_id: action.opts.game.id}).then((record) => {
          if (record) {
            let install = AppInstall.by_id[record._id]
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

export default { install }
