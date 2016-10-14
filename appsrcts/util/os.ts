
import spawn from './spawn'
import * as os from 'os'

interface AssertPresenceResult {
  code: number
  stdout: string
  stderr: string
  parsed: string
}

const self = {
  platform: function (): string {
    return process.platform
  },

  release: function (): string {
    return os.release()
  },

  arch: function (): string {
    return process.arch
  },

  inBrowser: function (): boolean {
    return self.processType() === 'browser'
  },

  inRenderer: function (): boolean {
    return self.processType() === 'renderer'
  },

  processType: function (): string {
    return process.type || 'browser'
  },

  getVersion: function (key): string {
    return process.versions[key]
  },

  /**
   * Get platform in the format used by the itch.io API
   */
  itchPlatform: function (): string {
    switch (self.platform()) {
      case 'darwin':
        return 'osx'
      case 'win32':
        return 'windows'
      case 'linux':
        return 'linux'
    }
  },

  cliArgs: function (): Array<string> {
    return process.argv
  },

  assertPresence: async function (command: string, args: Array<string>, parser: RegExp): Promise<AssertPresenceResult> {
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

    return { code, stdout, stderr, parsed }
  }
}

export default self
