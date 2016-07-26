
import spawn from './spawn'
import os from 'os'

const self = {
  platform: function () {
    return process.platform
  },

  release: function () {
    return os.release()
  },

  arch: function () {
    return process.arch
  },

  inBrowser: function () {
    return self.processType() === 'browser'
  },

  inRenderer: function () {
    return self.processType() === 'renderer'
  },

  processType: function () {
    return process.type || 'browser'
  },

  getVersion: function (key) {
    return process.versions[key]
  },

  /**
   * Get platform in the format used by the itch.io API
   */
  itchPlatform: function () {
    switch (self.platform()) {
      case 'darwin':
        return 'osx'
      case 'win32':
        return 'windows'
      case 'linux':
        return 'linux'
    }
  },

  cliArgs: function () {
    return process.argv
  },

  assertPresence: async function (command, args, parser) {
    let stdout = ''
    let stderr = ''

    args = args || []

    const spawnOpts = {
      command,
      args,
      onToken: (tok) => { stdout += '\n' + tok },
      onErrToken: (tok) => { stderr += '\n' + tok }
    }

    const code = await spawn(spawnOpts)
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
