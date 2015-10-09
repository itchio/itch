
import read_chunk from 'read-chunk'
import file_type from 'file-type'
import Promise from 'bluebird'

import {Deadend, Transition} from './errors'

import noop from '../util/noop'
let log = require('../util/log')('tasks/extract')

import InstallStore from '../stores/install_store'

function extract (opts) {
  let {archive_path} = opts
  let buffer = read_chunk.sync(archive_path, 0, 262)
  let type = file_type(buffer)

  if (!type) return Promise.reject(`Can't determine type of archive ${archive_path}`)

  log(opts, `type of ${archive_path}: ${JSON.stringify(type)}`)

  switch (type.ext) {
    case 'zip':
    case 'gz':
    case 'bz2':
    case '7z':
      return require('./extractors/7zip').extract(opts)
    default:
      return Promise.reject(`Don't know how to extract ${archive_path} / ${JSON.stringify(type)}`)
  }
}

function start (opts) {
  let {id, logger, onerror = noop} = opts
  let install

  return InstallStore.get_install(id).then((res) => {
    install = res
    log(opts, `got install with upload ${install.upload_id}`)

    if (!install.upload_id) {
      throw new Transition({
        to: 'find_upload',
        reason: 'nil uploads_id'
      })
    }

    let archive_path = InstallStore.archive_path(install.upload_id)
    let dest_path = InstallStore.app_path(id)
    let extract_opts = { logger, onerror, archive_path, dest_path }

    log(opts, `extract_opts = ${JSON.stringify(extract_opts)}`)
    return extract(extract_opts)
  }).catch((err) => {
    throw new Deadend({
      reason: err
    })
  })
}

export default { start, extract }
