
import app from 'app'
import path from 'path'
import fstream from 'fstream'

import http from '../util/http'
import os from '../util/os'

import Store from './store'

import AppDispatcher from '../dispatcher/app-dispatcher'
import AppConstants from '../constants/app-constants'
import AppActions from '../actions/app-actions'

let path_done = false

function augment_path () {
  let bin_path = path.join(app.getPath('userData'), 'bin')
  if (!path_done) {
    path_done = true
    process.env.PATH += `${path.delimiter}${bin_path}`
  }
  return bin_path
}

function binary_url () {
  let prefix = 'https://cdn.rawgit.com/itchio/7za-binaries/v9.20/'
  let file

  switch (os.platform()) {
    case 'win32':
      file = '7za.exe'
      break
    case 'darwin':
      file = '7za'
      break
    default:
      throw new Error('7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)')
  }
  let url = `${prefix}${file}`
  return {url, file}
}

function run () {
  let bin_path = augment_path()

  setImmediate(() => AppActions.setup_status('Checking for 7-zip'))
  return os.check_presence('7za').catch(() => {
    let {url, file} = binary_url()
    let target_path = path.join(bin_path, file)
    let sink = fstream.Writer({path: target_path, mode: 0o777})

    AppActions.setup_status('Downloading 7-zip...', 'download')
    return http.request({ url, sink })
  }).catch(err => {
    AppActions.setup_status(err.stack || err, 'error')
    throw err
  }).then(() => {
    AppActions.setup_done()
  })
}

let SetupStore = Object.assign(new Store('setup-store'), {
  // muffin
})

AppDispatcher.register('setup-store', Store.action_listeners(on => {
  on(AppConstants.WINDOW_READY, run)
}))

export default SetupStore
