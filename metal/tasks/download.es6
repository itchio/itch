
import {Transition, Deadend} from './errors'

import http from '../util/http'
import fs from '../util/fs'
import noop from '../util/noop'
let log = require('../util/log')('tasks/download')

import InstallStore from '../stores/install_store'
import AppStore from '../stores/app_store'

function start (opts) {
  let {id, onprogress = noop} = opts
  let headers = {}
  let flags = 'w'
  let install, upload, archive_path

  log(opts, 'started')

  return InstallStore.get_install(id).then((res) => {
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
      ? client.download_upload_with_key(install.key.id, install.upload_id)
      : client.download_upload(install.upload_id)
    ).then((res) => {
      return res.url
    }).catch((err) => {
      log(opts, `getting URL error: ${JSON.stringify(err)}`)
    })
  }).then((url) => {
    log(opts, `d/l from ${url}`)

    return http.to_file({
      url, headers,
      flags, file: archive_path,
      onprogress
    }).catch((err) => {
      log(opts, `download error: ${JSON.stringify(err)}`)
      throw new Deadend({
        reason: `Download error: ${err}`
      })
    })
  })
}

export default { start }
