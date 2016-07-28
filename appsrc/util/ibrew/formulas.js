
import ospath from 'path'
import sf from '../sf'

let self = {}

/**
 * a command-line tool for extracting various archives, including rar,
 * without silly license restrictions. pretty good.
 * https://bitbucket.org/WAHa_06x36/theunarchiver
 */
self['unarchiver'] = {
  format: 'tar.gz',
  subfolder: 'unarchiver',
  versionCheck: {
    command: 'unar',
    args: ['--version']
  },
  sanityCheck: {
    command: 'unar',
    args: ['--version']
  }
}

/**
 * your little itch.io helper
 * https://github.com/itchio/butler
 */
self['butler'] = {
  format: '7z',
  sanityCheck: {
    command: 'butler',
    args: ['-V']
  }
}

/**
 * privilege elevation:
 * https://github.com/itchio/elevate
 */
self['elevate'] = {
  format: '7z',
  osWhitelist: ['windows']
}

/**
 * bring macOS apps forwards even when executed directly:
 * https://github.com/itchio/activate
 */
self['activate'] = {
  format: '7z',
  osWhitelist: ['darwin']
}

/**
 * sandbox for Linux executables (seccomp-bpf sandbox)
 * https://github.com/netblue30/firejail
 * https://github.com/itchio/firejail-buildscripts
 */
self['firejail'] = {
  format: '7z',
  osWhitelist: ['linux'],
  skipUpgradeWhen: async function (opts) {
    const {binPath} = opts
    try {
      const stats = await sf.lstat(ospath.join(binPath, 'firejail'))
      if (stats.uid !== 0) {
        return 'not owned by root'
      }
      if ((stats.mode & 0o4000) === 0) {
        return 'not suid'
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        // all good
      } else {
        throw e
      }
    }
    return false
  },
  versionCheck: {
    args: ['--version'],
    parser: /firejail version ([0-9a-z.]*)/
  }
}

/*
 * Adobe runtime helper
 */
self['arh'] = {
  format: '7z',
  versionCheck: {
    args: [],
    parser: /Version ([0-9a-z.]*)/
  }
}

export default self
