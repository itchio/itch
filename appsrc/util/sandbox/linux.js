
import tmp from 'tmp'

import spawn from '../spawn'
import sudo from '../sudo'
import sf from '../sf'
import pathmaker from '../pathmaker'

import mklog from '../log'
const log = mklog('sandbox-linux')

import common from './common'

const USER = 'itch-player'
const DEFAULT_GROUPS = 'cdrom,floppy,audio,video,plugdev,'
const HAVEN_PATH = pathmaker.appPath({
  installLocation: 'haven',
  installFolder: '.'
})

export async function check () {
  const needs = []
  const errors = []

  const userCheck = await spawn.exec({command: 'sudo', args: ['-n', '-u', USER, '--', 'whoami']})
  if (userCheck.code !== 0) {
    needs.push({
      type: 'user',
      code: userCheck.code,
      err: userCheck.err
    })
  }

  const havenCheck = await sf.exists(HAVEN_PATH)
  if (!havenCheck) {
    needs.push({
      type: 'haven'
    })
  }

  return {needs, errors}
}

export async function install (opts, needs) {
  return await common.tendToNeeds(opts, needs, {
    haven: async () => {
      await spawn.exec({command: 'mkdir', args: ['-p', HAVEN_PATH]})
    },

    user: async () => {
      const lines = []
      lines.push('#!/bin/bash -xe')

      lines.push(`userdel ${USER}`)
      lines.push(`useradd -G ${DEFAULT_GROUPS} ${USER}`)

      await runScript(lines)
    }
  })
}

export async function uninstall (opts) {
  const errors = []

  const lines = []
  lines.push('#!/bin/bash -xe')
  lines.push(`userdel ${USER}`)

  try {
    log(opts, 'Removing user')
    await runScript(lines)
  } catch (e) {
    errors.push(e)
  }

  return {errors}
}

async function runScript (lines) {
  const contents = lines.join('\n')
  const tmpObj = tmp.fileSync()
  sf.writeFile(tmpObj.name, contents)

  let out = ''
  let e

  try {
    await sudo.exec(tmpObj.name, {
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
