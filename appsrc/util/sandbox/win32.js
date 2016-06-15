
import spawn from '../spawn'
import sf from '../sf'
import sudo from '../sudo'

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

  const userCheck = await spawn.exec({command: 'net', args: ['user', USER]})
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

  let out = ''
  let e

  try {
    await sudo.execAsync(`cmd.exe /c "${tmpObj.name}"`, {
      name: 'itch sandbox setup',
      on: (ps) => {
        ps.stdout.on('data', (data) => { out += data })
      }
    })
  } catch (err) { e = err }

  if (process.env.KEEP_MESS_AROUND === '1') {
    console.log(`keeping temp batch script at ${tmpObj.name}`)
  } else {
    tmpObj.removeCallback()
  }

  if (e) { throw e }

  return {out}
}

export default {check, install, uninstall}
