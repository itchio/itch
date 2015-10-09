
let os = {
  platform: () => {
    return process.platform
  },

  /**
   * Get platform in the format used by the itch.io API
   */
  itch_platform: () => {
    switch (os.platform()) {
      case 'darwin':
        return 'osx'
      case 'win32':
        return 'windows'
      case 'linux':
        return 'linux'
    }
  },

  cli_args: () => {
    return process.argv
  }
}

export default os
