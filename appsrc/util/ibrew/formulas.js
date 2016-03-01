
const os = require('../os')

let self = {}

/**
 * pretty much the best command-line unpacker
 * http://www.7-zip.org/license.txt
 */
self['7za'] = {
  format: 'executable',
  on_missing: () => {
    if (os.platform() === 'linux') {
      // TODO: add link to doc page too
      let msg = '7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)'
      throw new Error(msg)
    }
  },
  version_check: {
    args: [],
    parser: /([0-9a-z.v]*)(\s+beta)?[\s:]+Copyright/
  }
}

/**
 * your little itch.io helper
 * https://github.com/itchio/butler
 */
self['butler'] = {
  format: '7z'
}

/**
 * privilege elevation:
 * https://github.com/itchio/elevate
 */
self['elevate'] = {
  format: '7z',
  os_whitelist: ['windows']
}

/**
 * file(1) command, built for msys
 */
self['file'] = {
  format: '7z',
  os_whitelist: ['windows'],
  version_check: {
    args: ['--version'],
    parser: /file-([0-9a-z.]*)/
  }
}

/*
 * Adobe runtime helper
 */
self['arh'] = {
  format: '7z',
  version_check: {
    args: [],
    parser: /Version ([0-9a-z.]*)/
  }
}

export default self
