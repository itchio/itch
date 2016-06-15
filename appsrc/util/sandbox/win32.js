
import spawn from '../spawn'
import sf from '../sf'

import common from './common'

import tmp from 'tmp'

// note: itch-player's password is not a secret, as everything itch-player
// owns should be accessible by other users as well (but not the other
// way around)
const USER = 'itch-player'
const PASSWORD = 'salt'

export async function check () {
  const errors = []
  const needs = []

  const userCheck = await spawn.exec({command: 'elevate.exe', args: ['--runas', USER, PASSWORD, 'cmd.exe', '/c', 'echo', 'good']})
  if (userCheck.code !== 0) {
    needs.push({
      type: 'user',
      err: userCheck.err,
      code: userCheck.code
    })
  }

  return {errors, needs}
}

export async function install (opts, needs) {
  return await common.tendToNeeds(opts, needs, {
    user: async () => {
      const lines = []
      // in case the user was incorrectly setup
      lines.push(`net user ${USER} ${PASSWORD} /add`)
      // if we don't do this, it shows as a login user
      lines.push(`net localgroup Users ${USER} /delete`)
      await adminRunScript(lines)
    }
  })
}

export async function uninstall (opts) {
  return {errors: []}
}

async function adminRunScript (lines) {
  const contents = lines.join('\r\n')
  const tmpObj = tmp.fileSync({postfix: '.bat'})
  sf.writeFile(tmpObj.name, contents)

  console.log(`running batch script:\r\n${contents}`)

  const res = await spawn.exec({
    command: 'elevate.exe',
    args: ['cmd.exe', '/c', tmpObj.name]
  })

  if (process.env.KEEP_MESS_AROUND === '1') {
    console.log(`keeping temp batch script at ${tmpObj.name}`)
  } else {
    tmpObj.removeCallback()
  }

  if (res.code !== 0) {
    throw new Error(`adminRunScript failed with code ${res.code}. out = ${res.out}\n, err = ${res.err}\n`)
  }

  return {out: res.out}
}

export default {check, install, uninstall}
