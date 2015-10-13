
let self = {
  platform: function () {
    return process.platform
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
  }
}

export default self
