
import {Transition} from './errors'

import fstream from 'fstream'

let log = require('../util/log')('tasks/download')
import http from '../util/http'
import noop from '../util/noop'
import fs from '../promised/fs'

import InstallStore from '../stores/install-store'
import CredentialsStore from '../stores/credentials-store'

function start (opts) {
  let {id, onprogress = noop} = opts
  let headers = {}
  let flags = 'w'
  let install, upload, archive_path
  let done_alpha = 0

  log(opts, 'started')

  return InstallStore.get_install(id).then((res) => {
    install = res
    log(opts, 'got install')

    if (!install.upload_id || !install.uploads) {
      throw new Transition({
        to: 'find-upload',
        reason: 'nil upload_id / uploads'
      })
    }

    upload = install.uploads[install.upload_id]
    if (!upload) {
      throw new Transition({
        to: 'find-upload',
        reason: 'cannot find upload in install cache'
      })
    }

    archive_path = InstallStore.archive_path(install.upload_id)
    log(opts, `made archive path at ${archive_path}`)
  }).then(() => {
    log(opts, `lstating ${archive_path}`)
    // Check for existing files
    return fs.lstatAsync(archive_path).then((stats) => {
      return stats.size
    }).catch((e) => {
      // probably ENOENT
      return 0
    })
  }).then((local_size) => {
    log(opts, `got ${local_size} / ${upload.size} bytes locally`)

    // Check if our local file is complete
    if (local_size === upload.size) {
      throw new Transition({
        to: 'extract',
        reason: 'already downloaded fully'
      })
    }

    // Set up headers
    if (local_size > 0) {
      done_alpha = local_size / upload.size
      log(opts, `resuming from byte ${local_size}`)
      headers['Range'] = `bytes=${local_size}-`
      flags = 'a'
    } else {
      log(opts, `downloading full file`)
    }

    // Get download URL
    let client = CredentialsStore.get_current_user()
    return (install.key
      ? client.download_upload_with_key(install.key.id, install.upload_id)
      : client.download_upload(install.upload_id)
    ).then((res) => {
      return res.url
    })
  }).then((url) => {
    log(opts, `d/l from ${url}`)

    return http.request({
      url, headers,
      onprogress: (state) => {
        let percent = done_alpha * 100 + (1 - done_alpha) * state.percent
        onprogress({percent})
      },
      sink: fstream.Writer({path: archive_path, flags})
    })
  })
}

export default { start }
