
import spawn from './spawn'

let self = {
  platform: function () {
    return process.platform
  },

  arch: function () {
    return process.arch
  },

  in_browser: function () {
    return self.process_type() === 'browser'
  },

  in_renderer: function () {
    return self.process_type() === 'renderer'
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

  assert_presence: async function (command, args, parser) {
    if (typeof args === 'undefined') {
      args = []
    }

    let stdout = ''
    let stderr = ''

    let spawn_opts = {
      command,
      args,
      ontoken: (tok) => stdout += '\n' + tok,
      onerrtoken: (tok) => stderr += '\n' + tok
    }
    let code = await spawn(spawn_opts)
    if (code !== 0) {
      throw new Error(`${command} exited with code ${code}\n${stdout}\n${stderr}`)
    }

    let parsed = null
    if (parser) {
      let matches = parser.exec(stdout + '\n' + stderr)
      if (matches) {
        parsed = matches[1]
      }
    }

    return {code, stdout, stderr, parsed}
  }
}

export default self
