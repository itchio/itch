
import read_chunk from 'read-chunk'
import file_type from 'file-type'
import Promise from 'bluebird'

import {Transition} from './errors'

import noop from '../util/noop'
let log = require('../util/log')('tasks/extract')

import InstallStore from '../stores/install-store'
import AppActions from '../actions/app-actions'

let self = {
  extract: function (opts) {
    let {archive_path} = opts
    let buffer = read_chunk.sync(archive_path, 0, 262)
    let type = file_type(buffer)

    if (!type) return Promise.reject(`invalid archive ${archive_path}`)

    log(opts, `type of ${archive_path}: ${JSON.stringify(type)}`)

    switch (type.ext) {
      case 'zip':
      case 'gz':
      case 'bz2':
      case '7z':
        return require('./extractors/7zip').extract(opts)
      default:
        return Promise.reject(`invalid archive ${archive_path}: ${JSON.stringify(type)}`)
    }
  },

  start: function (opts) {
    let {id, logger, onerror = noop, onprogress = noop} = opts
    let install

    return InstallStore.get_install(id).then((res) => {
      install = res
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

      return AppActions.install_update(id, {launchable: false}).then(() => {
        return self.extract(extract_opts)
      }).then(() => {
        return AppActions.install_update(id, {launchable: true})
      })
    })
  }
}

export default self
