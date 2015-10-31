
import read_chunk from '../promised/read-chunk'
import file_type from 'file-type'

import {Transition} from './errors'

import noop from '../util/noop'
let log = require('../util/log')('tasks/extract')

import InstallStore from '../stores/install-store'
import AppActions from '../actions/app-actions'

let self = {
  extract: async function (opts) {
    let {archive_path} = opts
    let buffer = await read_chunk(archive_path, 0, 262)
    let type = file_type(buffer)

    if (!type) throw new Error(`invalid archive ${archive_path}`)

    log(opts, `type of ${archive_path}: ${JSON.stringify(type)}`)

    switch (type.ext) {
      case 'zip':
      case 'gz':
      case 'bz2':
      case '7z':
        return require('./extractors/7zip').extract(opts)
      default:
        throw new Error(`invalid archive ${archive_path}: ${JSON.stringify(type)}`)
    }
  },

  start: async function (opts) {
    let {id, logger, onerror = noop, onprogress = noop} = opts

    let install = await InstallStore.get_install(id)
    log(opts, `got install with upload ${install.upload_id}`)

    if (!install.upload_id) {
      throw new Transition({
        to: 'find-upload',
        reason: 'nil upload_id'
      })
    }

    let archive_path = InstallStore.archive_path(install.upload_id)
    let dest_path = InstallStore.app_path(id)
    let extract_opts = { logger, onerror, onprogress, archive_path, dest_path }

    AppActions.install_update(id, {launchable: false})
    await self.extract(extract_opts)
    AppActions.install_update(id, {launchable: true})
  }
}

export default self
