'use nodent';'use strict'

import {Transition} from './errors'

let log = require('../util/log')('tasks/download')
import http from '../util/http'
import noop from '../util/noop'

import CaveStore from '../stores/cave-store'
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
  let {id, onprogress = noop, logger} = opts

  let cave = await CaveStore.find(id)

  ensure(cave.upload_id, 'need upload id')
  ensure(cave.uploads, 'need cached uploads')

  let upload = cave.uploads[cave.upload_id]
  ensure(upload, 'need upload in upload cache')

  // Get download URL
  let client = CredentialsStore.get_current_user()
  let url = (await (cave.key
    ? client.download_upload_with_key(cave.key.id, cave.upload_id)
    : client.download_upload(cave.upload_id)
  )).url

  log(opts, `d/l from ${url}`)

  await http.request({
    url, onprogress, logger,
    dest: CaveStore.archive_path(upload)
  })
}

export default { start }
