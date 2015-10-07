
import Promise from 'bluebird'

export function configure (app_path) {
  console.log(`Configuring app at '${app_path}'`)

  switch (process.platform) {
    case 'darwin':
    case 'win32':
    case 'linux':
      return require(`./configurators/${process.platform}`).configure(app_path)
    default:
      return Promise.reject(`Unsupported platform: ${process.platform}`)
  }
}

export default {
  configure
}

