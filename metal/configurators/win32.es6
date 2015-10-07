
import {flatten} from 'underscore'
import Promise from 'bluebird'
let glob = Promise.promisify(require('glob'))

function log (msg) {
  console.log(`[configurators/win32] ${msg}`)
}

export function configure (app_path) {
  let promises = ['exe', 'bat'].map((ext) => glob(`${app_path}/**/*.${ext}`))

  return Promise.all(promises).then(flatten).then((executables) => {
    log(`Found ${executables.length} executables`)
    return {executables}
  })
}

