
import tmp from 'tmp'
import path from 'path'

import spawn from '../spawn'
import sudo from '../sudo'
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
    firejail: async (need) => {
      log(opts, `installing firejail, because ${need.err} (code ${need.code})`)

      // normally already installed by setup phase
      // FIXME: can't use here because sagas :( cf. https://github.com/itchio/itch/issues/695
      // await ibrew.fetch(opts, 'firejail')

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
  sf.writeFile(tmpObj.name, contents)

  let out = ''
  let e

  try {
    await sudo.execAsync(tmpObj.name, {
      on: (ps) => {
        ps.stdout.on('data', (data) => { out += data })
      }
    })
  } catch (err) { e = err }

  tmpObj.removeCallback()

  if (e) { throw e }

  return {out}
}

export default {check, install, uninstall}
