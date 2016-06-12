
import spawn from '../spawn'

import common from './common'

export async function check () {
  try {
    const output = await spawn.getOutput({
      command: 'net',
      args: ['user', 'itch-player']
    })
    console.log('sandbox check output = ', output)
    return true
  } catch (err) {
    console.log('while checking for win32 sandbox: ' + err)
    // net user itch-player salt /add
    // net localgroup Users itch-player /delete
    return false
  }
}

export async function install (opts, needs) {
  return await common.tendToNeeds(opts, needs, {})
}

export async function uninstall (opts) {
  return {errors: []}
}

export default {check, install, uninstall}
