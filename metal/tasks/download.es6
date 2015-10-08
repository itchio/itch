
import Promise from 'bluebird'

import app from 'app'
import request from 'request'
import progress from 'request-progress'
import mkdirp from 'mkdirp'
import path from 'path'

import {Transition} from './errors'

import fs from '../util/fs'
import noop from '../util/noop'
let log = require('../util/log')('tasks/download')

import InstallStore from '../stores/install_store'
import AppStore from '../stores/app_store'

function download (id, opts) {
  let {onprogress = noop} = opts
  let headers = {
    'User-Agent': `itch.io client v${app.getVersion()}`
  }
  let flags = 'w'
  let install, upload, archive_path

  log(opts, 'started')

  return InstallStore.get_install(id).then((res) => {
    // Fetch up-to-date install information
    install = res

    log(opts, 'got install')

    if (!install.upload_id || !install.uploads) {
      throw new Transition({
        to: 'find_upload',
        reason: 'nil upload_id / upload'
      })
    }

    upload = install.uploads[install.upload_id]
    if (!upload) {
      throw new Transition({
        to: 'find_upload',
        reason: 'cannot find upload in install cache'
      })
    }

    archive_path = InstallStore.archive_path(install.upload_id)
    mkdirp.sync(path.dirname(archive_path))

    log(opts, `made archive path at ${archive_path}`)
  }).then(() => {
    log(opts, `lstating ${archive_path}`)
    // Check for existing files
    return fs.lstatAsync(archive_path).then((stats) => {
      log(opts, `got stats: ${JSON.stringify(stats)}`)
      return stats.size
    }).catch((e) => {
      log(opts, `didn't get squat`)
      // probably ENOENT
      return 0
    })
  }).then((local_size) => {
    log(opts, `local size is  ${local_size}`)
    log(opts, `upload size is ${upload.size}`)

    // Check if our local file is complete
    if (local_size === upload.size) {
      throw new Transition({
        to: 'extract',
        reason: 'already downloaded fully'
      })
    }

    // Set up headers
    if (local_size > 0) {
      log(opts, `resuming from byte ${local_size}`)
      headers['Range'] = `bytes=${local_size}-`
      flags = 'a'
    } else {
      log(opts, `downloading full file`)
    }

    // Get download URL
    let client = AppStore.get_current_user()
    return (install.key
      ? client.download_upload_with_key(install.key, install.upload_id)
      : client.download_upload(install.upload_id)
    ).then((res) => {
      return res.url
    }).catch((err) => {
      log(opts, `getting URL error: ${JSON.stringify(err)}`)
    })
  }).then((url) => {
    log(opts, `downloading from ${url}`)
    return new Promise((resolve, reject) => {
      let r = progress(request.get({
        encoding: null, // binary (otherwise defaults to utf-8)
        url,
        headers
      }))

      r.on('error', (err) => {
        log(opts, `download error: ${JSON.stringify(err)}`)
      })

      r.on('progress', (state) => {
        log(opts, `progress state: ${JSON.stringify(state)}`)
        onprogress(state)
      })

      let dst = fs.createWriteStream(archive_path, {
        flags,
        defaultEncoding: 'binary'
      })
      r.pipe(dst)

      r.on('close', () => {
        resolve('Done!')
      })
    })
  })
}

export default { download }
