
import tmp from 'tmp'
import path from 'path'

import spawn from '../spawn'
import sf from '../sf'
import ibrew from '../ibrew'

import mklog from '../log'
const log = mklog('sandbox-linux')

import common from './common'

export async function check (opts) {
  const needs = []
  const errors = []

  log(opts, 'Testing firejail')
  const firejailCheck = await spawn.exec({command: 'firejail', args: ['--noprofile', '--', 'whoami']})
  if (firejailCheck.code !== 0) {
    needs.push({
      type: 'firejail',
      code: firejailCheck.code,
      err: firejailCheck.err
    })
  }

  return {needs, errors}
}

export async function install (opts, needs) {
  return await common.tendToNeeds(opts, needs, {
    firejail: async function (need) {
      log(opts, `installing firejail, because ${need.err} (code ${need.code})`)

      // normally already installed by setup phase
      await ibrew.fetch(opts, 'firejail')

      const firejailBinary = path.join(ibrew.binPath(), 'firejail')
      const firejailBinaryExists = await sf.exists(firejailBinary)
      if (!firejailBinaryExists) {
        throw new Error('failed to install firejail')
      } else {
        const lines = []
        lines.push('#!/bin/bash -xe')
        lines.push(`chown root:root ${firejailBinary}`)
        lines.push(`chmod u+s ${firejailBinary}`)

        log(opts, 'Making firejail binary setuid')
        await sudoRunScript(lines)
      }
    }
  })
}

export async function uninstall (opts) {
  const errors = []
  return {errors}
}

async function sudoRunScript (lines) {
  const contents = lines.join('\n')
  const tmpObj = tmp.fileSync()
  await sf.writeFile(tmpObj.name, contents)
  await sf.chmod(tmpObj.name, 0o777)
  // TODO: boo hiss
  sf.fs.closeSync(tmpObj.fd)

  const res = await spawn.exec({command: 'pkexec', args: [tmpObj.name]})

  tmpObj.removeCallback()

  if (res.code !== 0) {
    throw new Error(`pkexec failed with code ${res.code}, stderr = ${res.err}`)
  }

  return {out: res.out}
}

export default {check, install, uninstall}
