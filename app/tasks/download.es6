
import {Transition} from './errors'

let log = require('../util/log')('tasks/download')
import http from '../util/http'
import noop from '../util/noop'

import InstallStore from '../stores/install-store'
import CredentialsStore from '../stores/credentials-store'

function ensure (predicate, reason) {
  if (!predicate) {
    throw new Transition({
      to: 'find-upload',
      reason
    })
  }
}

async function start (opts) {
  let {id, onprogress = noop} = opts

  let install = await InstallStore.get_install(id)

  ensure(install.upload_id, 'need upload id')
  ensure(install.uploads, 'need cached uploads')

  let upload = install.uploads[install.upload_id]
  ensure(upload, 'need upload in upload cache')

  // Get download URL
  let client = CredentialsStore.get_current_user()
  let url = (await (install.key
    ? client.download_upload_with_key(install.key.id, install.upload_id)
    : client.download_upload(install.upload_id)
  )).url

  log(opts, `d/l from ${url}`)

  await http.request({
    url, onprogress,
    dest: InstallStore.archive_path(upload)
  })
}

export default { start }
