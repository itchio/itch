
import Promise from 'bluebird'
import spawn from 'win-spawn'

let self = {
  platform: function () {
    return process.platform
  },

  process_type: function () {
    return process.type
  },

  get_version: function (key) {
    return process.versions[key]
  },

  /**
   * Get platform in the format used by the itch.io API
   */
  itch_platform: function () {
    switch (self.platform()) {
      case 'darwin':
        return 'osx'
      case 'win32':
        return 'windows'
      case 'linux':
        return 'linux'
    }
  },

  cli_args: function () {
    return process.argv
  },

  check_presence: function (command, args = []) {
    return new Promise((resolve, reject) => {
      let child = spawn(command, args)
      child.on('error', (e) => null)
      child.on('close', (code) => {
        if (code === 0) {
          resolve(code)
        } else {
          reject(`${command} exited with code ${code}`)
        }
      })
    })
  }
}

export default self
