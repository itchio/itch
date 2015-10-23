
import {Transition} from './errors'

let log = require('../util/log')('tasks/download')
import http from '../util/http'
import noop from '../util/noop'

import InstallStore from '../stores/install-store'
import CredentialsStore from '../stores/credentials-store'

function start (opts) {
  let {id, onprogress = noop} = opts
  let install, upload, archive_path

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
      url,
      onprogress,
      dest: archive_path
    })
  })
}

export default { start }
