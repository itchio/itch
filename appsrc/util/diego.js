
/* Diego is your little diagnostics mercenary! */
import mklog from './log'
const _log = mklog('diego')
import os from './os'
import spawn from './spawn'

let self = {
  hire: async function (opts) {
    let log = _log.bind(null, opts)

    // privacy setting: add 'export DIEGO_IS_ASLEEP' to your ~/.bashrc, ~/.zshrc etc.
    // to make sure diego never looks around.
    // note that, logs don't leave your computer unless you post them yourself on the
    // issue tracker for example, but I figured it's easy for us to provide a way
    // to turn it off
    if (process.env.DIEGO_IS_ASLEEP) {
      log('diego is asleep.')
      return
    }

    log('diego here, looking around')

    let dump = async (full, re) => {
      if (typeof re === 'undefined') {
        re = /.*/
      }

      // for our purpose, no need to worry about escaping arguments.
      let args = full.split(' ')
      let command = args.shift()
      try {
        await spawn({
          command, args, onToken: (tok) => (re.test(tok) && log(tok))
        })
      } catch (e) { log(`"${full}" resisted us: ${e.message || '?'}`) }
    }

    switch (os.itch_platform()) {
      case 'windows':
        await dump('cmd.exe /c ver')
        // weirdest syntax ever, 'name,' and 'caption,' are separate arguments...
        await dump('wmic cpu get name, caption, maxclockspeed')
        await dump('wmic path Win32_VideoController get Name')
        break
      case 'linux':
        await dump('uname -a')
        await dump('cat /proc/cpuinfo', /model name/)
        await dump('lsb_release -a')
        await dump('lspci', /VGA compatible/)
        break
      case 'osx':
        await dump('uname -a')
        await dump('sw_vers')
        await dump('system_profiler SPHardwareDataType SPDisplaysDataType')
        break
    }

    log('diego out')
  }
}

export default self
