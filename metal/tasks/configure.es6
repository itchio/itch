
import Promise from 'bluebird'
import os from '../util/os'

export function configure (app_path) {
  console.log(`Configuring app at '${app_path}'`)
  let platform = os.platform()

  switch (platform) {
    case 'darwin':
    case 'win32':
    case 'linux':
      return require(`./configurators/${platform}`).configure(app_path)
    default:
      return Promise.reject(`Unsupported platform: ${platform}`)
  }
}

export default {configure}
