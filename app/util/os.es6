
import Promise from 'bluebird'
import spawn from 'win-spawn'

let self = {
  platform: function () {
    return process.platform
  },

  arch: function () {
    return process.arch
  },

  process_type: function () {
    return process.type || 'browser'
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

  check_presence: function (command, args = [], parser = null) {
    return new Promise((resolve, reject) => {
      let child = spawn(command, args)

      let stdout = ''
      child.stdout.on('data', (data) => stdout += data)

      let stderr = ''
      child.stderr.on('data', (data) => stderr += data)

      child.on('error', (e) => null)
      child.on('close', (code) => {
        if (code === 0) {
          let parsed = null
          if (parser) {
            let matches = stdout.match(parser)
            if (matches) {
              parsed = matches[1]
            }
          }

          resolve({code, stdout, stderr, parsed})
        } else {
          reject(new Error(`${command} exited with code ${code}\nstdout: ${stdout}\n\nstderr: ${stderr}`))
        }
      })
    })
  }
}

export default self
