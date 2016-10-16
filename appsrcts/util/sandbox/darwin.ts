
import * as ospath from 'path'
import * as tmp from 'tmp'
import * as invariant from 'invariant'

import sandboxTemplate from '../../constants/sandbox-policies/macos-template'

import spawn from '../spawn'
import sf from '../sf'

import { Logger } from '../log'
import mklog from '../log'
const log = mklog('sandbox/darwin')

import common from './common'

import { Need } from './types'
import { GameRecord } from '../../types/db'

const INVESTIGATE_SANDBOX = process.env.INVESTIGATE_SANDBOX === '1'

export async function check() {
  const needs: Array<Need> = []
  const errors: Array<Error> = []

  const seRes = await spawn.exec({ command: 'sandbox-exec', args: ['-n', 'no-network', 'true'] })
  if (seRes.code !== 0) {
    errors.push(new Error('sandbox-exec is missing. Is macOS too old?'))
  }

  return { needs, errors }
}

export interface WithinOpts {
  game: GameRecord
  appPath: string
  exePath: string
  fullExec: string
  argString: string
  isBundle: boolean

  logger: Logger
}

export interface WithinCbOpts {
  fakeApp: string
}

export async function within(opts: WithinOpts, cb: (opts: WithinCbOpts) => Promise<void>) {
  const {appPath, exePath, fullExec, argString, game, isBundle} = opts

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
  const workDir = tmp.dirSync()
  const exeName = ospath.basename(fullExec)

  const realApp = exePath
  let fakeApp
  if (isBundle) {
    fakeApp = ospath.join(workDir.name, ospath.basename(realApp))
  } else {
    fakeApp = ospath.join(workDir.name, game.title + '.app')
  }
  log(opts, `fake app path: ${fakeApp}`)

  await sf.mkdir(fakeApp)
  await sf.mkdir(ospath.join(fakeApp, 'Contents'))
  await sf.mkdir(ospath.join(fakeApp, 'Contents', 'MacOS'))

  const fakeBinary = ospath.join(fakeApp, 'Contents', 'MacOS', exeName)
  await sf.writeFile(fakeBinary,
    `#!/bin/bash
cd ${spawn.escapePath(ospath.dirname(fullExec))}
sandbox-exec -f ${spawn.escapePath(sandboxProfilePath)} ${spawn.escapePath(fullExec)} ${argString}`
  )
  await sf.chmod(fakeBinary, 0o700)

  if (isBundle) {
    await sf.symlink(
      ospath.join(realApp, 'Contents', 'Resources'),
      ospath.join(fakeApp, 'Contents', 'Resources')
    )

    await sf.symlink(
      ospath.join(realApp, 'Contents', 'Info.plist'),
      ospath.join(fakeApp, 'Contents', 'Info.plist')
    )
  } else {
    await sf.writeFile(ospath.join(fakeApp, 'Contents', 'Info.plist'),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${exeName}</string>
</dict>
</plist>`)
  }

  let err
  try {
    await cb({ fakeApp })
  } catch (e) { err = e }

  if (INVESTIGATE_SANDBOX) {
    log(opts, 'waiting forever for someone to investigate the sandbox')
    await new Promise((resolve, reject) => { })
  }

  log(opts, 'cleaning up fake app')
  await sf.wipe(fakeApp)
  workDir.removeCallback()

  if (err) {
    throw err
  }
}

export async function install(opts: any, needs: Array<Need>) {
  return await common.tendToNeeds(opts, needs, {})
}

export async function uninstall(opts: any) {
  return { errors: [] }
}

export default { check, install, uninstall, within }
