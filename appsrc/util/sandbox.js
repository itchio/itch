
import os from './os'
import spawn from './spawn'

export async function setup () {
  switch (os.platform()) {
    case 'linux':
      return await setupLinux()

    case 'win32':
      return await setupWin32()

    case 'darwin':
      return await setupDarwin()

    default:
  }
}

export async function setupLinux () {
  try {
    const output = await spawn.getOutput({
      command: 'sudo',
      args: [
        '-n', // non-interactive (don't ask for password)
        '-u', 'itch-player',
        'whoami'
      ]
    })
    console.log('sandbox check output = ', output)
    return true
  } catch (err) {
    console.log('while checking for linux sandbox: ' + err)
    return false
  }
}

export async function setupWin32 () {
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

export async function setupDarwin () {
  try {
    const output = await spawn.getOutput({
      command: 'net',
      args: ['user', 'itch-player']
    })
    console.log('sandbox check output = ', output)
    return true
  } catch (err) {
    console.log('while checking for darwin sandbox: ' + err)
    return false
  }
}

export default {setup}
