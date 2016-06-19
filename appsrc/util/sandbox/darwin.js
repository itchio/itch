
import ospath from 'path'
import tmp from 'tmp'
import invariant from 'invariant'

import sandboxTemplate from '../../constants/sandbox-template'

import spawn from '../spawn'
import sf from '../sf'

import mklog from '../log'
const log = mklog('sandbox/darwin')

import common from './common'

export async function check () {
  const needs = []
  const errors = []

  const seRes = await spawn.exec({command: 'sandbox-exec', args: ['-n', 'no-network', 'true']})
  if (seRes.code !== 0) {
    errors.push('sandbox-exec is missing. Is macOS too old?')
  }

  return {needs, errors}
}

export async function within (opts, cb) {
  const {appPath, exePath, fullExec, argString, isBundle} = opts
  invariant(typeof appPath === 'string', 'sandbox.within needs appPath')
  invariant(typeof exePath === 'string', 'sandbox.within needs exePath')
  invariant(typeof fullExec === 'string', 'sandbox.within needs fullExec')
  invariant(typeof argString === 'string', 'sandbox.within needs argString')
  invariant(typeof isBundle === 'boolean', 'sandbox.within needs argString')

  log(opts, 'generating sandbox policy')
  const sandboxProfilePath = ospath.join(appPath, '.itch', 'isolate-app.sb')

  const userLibrary = (await spawn.getOutput({
    command: 'activate',
    args: ['--print-library-paths'],
    logger: opts.logger
  })).split('\n')[0].trim()
  log(opts, `user library = '${userLibrary}'`)

  const sandboxSource = sandboxTemplate
  .replace(/{{USER_LIBRARY}}/g, userLibrary)
  .replace(/{{INSTALL_LOCATION}}/g, appPath)
  await sf.writeFile(sandboxProfilePath, sandboxSource)

  log(opts, 'creating fake app bundle')
  if (!isBundle) {
    throw new Error('app isolation is only supported for bundles')
  }
  const workDir = tmp.dirSync()
  const exeName = ospath.basename(fullExec)

  const realApp = exePath
  const fakeApp = ospath.join(workDir.name, ospath.basename(realApp))
  log(opts, `fake app path: ${fakeApp}`)

  await sf.mkdir(fakeApp)
  await sf.mkdir(ospath.join(fakeApp, 'Contents'))
  await sf.mkdir(ospath.join(fakeApp, 'Contents', 'MacOS'))

  const fakeBinary = ospath.join(fakeApp, 'Contents', 'MacOS', exeName)
  await sf.writeFile(fakeBinary,
    `#!/bin/bash
    sandbox-exec -f ${spawn.escapePath(sandboxProfilePath)} ${spawn.escapePath(fullExec)} ${argString}
    `
  )
  await sf.chmod(fakeBinary, 0o700)

  await sf.symlink(
    ospath.join(realApp, 'Contents', 'Resources'),
    ospath.join(fakeApp, 'Contents', 'Resources')
  )

  await sf.symlink(
    ospath.join(realApp, 'Contents', 'Info.pList'),
    ospath.join(fakeApp, 'Contents', 'Info.pList')
  )

  let err
  try {
    await cb({fakeApp})
  } catch (e) { err = e }

  log(opts, 'cleaning up fake app')
  await sf.wipe(fakeApp)
  workDir.removeCallback()

  if (err) {
    throw err
  }
}

export async function install (opts, needs) {
  return await common.tendToNeeds(opts, needs, {})
}

export async function uninstall (opts) {
  return {errors: []}
}

export default {check, install, uninstall, within}
