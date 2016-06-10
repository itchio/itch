
import path from 'path'
import invariant from 'invariant'
import tmp from 'tmp'

import {sortBy} from 'underline'
import Promise from 'bluebird'
import shellQuote from 'shell-quote'

import sandboxTemplate from '../../constants/sandbox-template'

import sandbox from '../../util/sandbox'
import os from '../../util/os'
import sf from '../../util/sf'
import spawn from '../../util/spawn'
import pathmaker from '../../util/pathmaker'

import mklog from '../../util/log'
const log = mklog('tasks/launch')

import {Crash} from '../errors'

async function doSpawn (exePath, fullCommand, opts) {
  log(opts, `doSpawn ${fullCommand}`)

  const cwd = path.dirname(exePath)
  log(opts, `Working directory: ${cwd}`)

  const args = shellQuote.parse(fullCommand)
  const command = args.shift()
  log(opts, `Command: ${command}`)
  log(opts, `Args: ${args}`)

  const code = await spawn({
    command,
    args,
    onToken: (tok) => log(opts, `stdout: ${tok}`),
    onErrToken: (tok) => log(opts, `stderr: ${tok}`),
    opts: {cwd}
  })

  if (code !== 0) {
    const error = `process exited with code ${code}`
    throw new Crash({exePath, error})
  }
  return 'child completed successfully'
}

function escape (arg) {
  return `"${arg.replace(/"/g, '\\"')}"`
}

async function computeWeight (appPath, execs) {
  const output = []

  const f = async function (exe) {
    const exePath = path.join(appPath, exe.path)
    let stats
    try {
      stats = await sf.stat(exePath)
    } catch (err) {
      // entering the ultra hat dimension
    }

    if (stats) {
      exe.weight = stats.size
      output.push(exe)
    }
  }
  await Promise.resolve(execs).map(f, {concurrency: 4})

  return output
}

function computeDepth (execs) {
  for (const exe of execs) {
    exe.depth = path.normalize(exe.path).split(path.sep).length
  }

  return execs
}

function computeScore (execs) {
  const output = []

  for (const exe of execs) {
    let score = 100

    if (/unins.*\.exe$/i.test(exe.path)) {
      score -= 50
    }
    if (/^kick\.bin/i.test(exe.path)) {
      score -= 50
    }
    if (/nwjc\.exe$/i.test(exe.path)) {
      score -= 20
    }
    if (/dxwebsetup\.exe$/i.test(exe.path)) {
      score = 0
    }
    if (/vcredist.*\.exe$/i.test(exe.path)) {
      score = 0
    }
    if (/\.(so|dylib)/.test(exe.path)) {
      score = 0
    }
    if (/\.sh/.test(exe.path)) {
      score += 20
    }
    exe.score = score

    if (score > 0) {
      output.push(exe)
    }
  }

  return output
}

function isAppBundle (exePath) {
  return /\.app\/?$/.test(exePath.toLowerCase())
}

async function launchExecutable (exePath, args, opts) {
  const platform = os.platform()
  log(opts, `launching '${exePath}' on '${platform}' with args '${args.join(' ')}'`)
  const argString = args.map((x) => escape(x)).join(' ')

  const {cave} = opts
  const appPath = pathmaker.appPath(cave)

  const {isolateApps} = opts.preferences
  if (isolateApps) {
    const sandboxReady = await sandbox.setup()
    if (!sandboxReady) {
      throw new Error('sandbox could not be prepared')
    }
  }

  let fullExec = exePath
  if (platform === 'darwin') {
    const isBundle = isAppBundle(exePath)
    if (isBundle) {
      fullExec = await spawn.getOutput({
        command: 'activate',
        args: ['--print-bundle-executable-path', exePath],
        logger: opts.logger
      })
    }

    if (isolateApps) {
      log(opts, 'app isolation enabled')

      log(opts, 'writing sandbox file')
      const sandboxProfilePath = path.join(appPath, '.itch', 'isolate-app.sb')

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
      const exeName = path.basename(fullExec)

      const realApp = exePath
      const fakeApp = path.join(workDir.name, path.basename(realApp))
      log(opts, `fake app path: ${fakeApp}`)

      await sf.mkdir(fakeApp)
      await sf.mkdir(path.join(fakeApp, 'Contents'))
      await sf.mkdir(path.join(fakeApp, 'Contents', 'MacOS'))

      const fakeBinary = path.join(fakeApp, 'Contents', 'MacOS', exeName)
      await sf.writeFile(fakeBinary,
`#!/bin/bash
sandbox-exec -f ${escape(sandboxProfilePath)} ${escape(fullExec)} ${argString}
`)
      await sf.chmod(fakeBinary, 0o700)

      await sf.symlink(
        path.join(realApp, 'Contents', 'Resources'),
        path.join(fakeApp, 'Contents', 'Resources'))

      await sf.symlink(
        path.join(realApp, 'Contents', 'Info.pList'),
        path.join(fakeApp, 'Contents', 'Info.pList'))

      await doSpawn(fullExec, `open -W ${escape(fakeApp)}`, opts)

      log(opts, 'cleaning up fake app')
      await sf.wipe(fakeApp)
      workDir.removeCallback()
    } else {
      log(opts, 'no app isolation')
      await doSpawn(fullExec, `open -W ${escape(exePath)} --args ${argString}`, opts)
    }
  } else if (platform === 'win32') {
    let cmd = `${escape(exePath)}`
    if (argString.length > 0) {
      cmd += ` ${argString}`
    }

    const grantPath = path.join(appPath, '*')
    if (isolateApps) {
      const grantRes = await spawn.getOutput({
        command: 'icacls',
        args: [ grantPath, '/grant', 'itch-player:F', '/t' ],
        logger: opts.logger
      })
      log(opts, `grant output:\n${grantRes}`)

      cmd = `elevate --runas itch-player salt ${cmd}`
    }
    await doSpawn(exePath, cmd, opts)

    if (isolateApps) {
      const denyRes = await spawn.getOutput({
        command: 'icacls',
        args: [ grantPath, '/deny', 'itch-player:F', '/t' ],
        logger: opts.logger
      })
      log(opts, `deny output:\n${denyRes}`)
    }
  } else if (platform === 'linux') {
    let cmd = `${escape(exePath)}`
    if (argString.length > 0) {
      cmd += ` ${argString}`
    }
    if (isolateApps) {
      const safeBasePath = '/home/itch-player'
      const relExePath = path.relative(appPath, exePath)
      log(opts, `relExePath = ${relExePath}`)

      const safeAppPath = path.join(safeBasePath, path.basename(appPath))
      log(opts, `safeAppPath = ${safeAppPath}`)

      const safeExePath = path.join(safeAppPath, relExePath)
      log(opts, `safeExePath = ${safeExePath}`)

      const chmodRes = await spawn.getOutput({
        command: 'sudo',
        args: [ '-n', '-u', 'itch-player', '--', 'chmod', 'o+rwx', safeBasePath ],
        logger: opts.logger
      })
      log(opts, `chmod output:\n${chmodRes}`)

      const mvRes = await spawn.getOutput({
        command: 'mv',
        args: [ appPath, safeAppPath ],
        logger: opts.logger
      })
      log(opts, `mv output:\n${mvRes}`)

      cmd = `sudo -n -u itch-player -- ${escape(safeExePath)} ${argString}`

      let ret
      let err
      try {
        ret = await doSpawn(safeExePath, cmd, opts)
      } catch (e) { err = e }

      const mvBackRes = await spawn.getOutput({
        command: 'mv',
        args: [ safeAppPath, appPath ],
        logger: opts.logger
      })
      log(opts, `mvBack output:\n${mvBackRes}`)

      if (err) {
        throw err
      }
      return ret
    } else {
      await doSpawn(exePath, cmd, opts)
    }
  } else {
    throw new Error(`unsupported platform: ${platform}`)
  }
}

export default async function launch (out, opts) {
  const {cave} = opts
  invariant(cave, 'launch-native has cave')

  const appPath = pathmaker.appPath(cave)

  let candidates = cave.executables.map((path) => ({path}))
  log(opts, `initial candidate set: ${JSON.stringify(candidates, null, 2)}`)

  candidates = await computeWeight(appPath, candidates)
  candidates = computeScore(candidates)
  candidates = computeDepth(candidates)

  candidates = candidates::sortBy((x) => -x.weight)
  log(opts, `candidates after weight sorting: ${JSON.stringify(candidates, null, 2)}`)

  candidates = candidates::sortBy((x) => -x.score)
  log(opts, `candidates after score sorting: ${JSON.stringify(candidates, null, 2)}`)

  candidates = candidates::sortBy((x) => x.depth)
  log(opts, `candidates after depth sorting: ${JSON.stringify(candidates, null, 2)}`)

  if (candidates.length === 0) {
    const err = new Error('After weighing/sorting, no executables left')
    err.reason = ['game.install.no_executables_found']
    throw err
  }

  if (candidates.length > 1) {
    // TODO: figure this out. We want to let people choose, but we also don't
    // want to confuse them — often there are 2 or 3 executables and the app already
    // picks the best way to start the game.
  }

  let exePath = path.join(appPath, candidates[0].path)
  const args = []

  if (/\.jar$/i.test(exePath)) {
    log(opts, 'Launching .jar')
    args.push('-jar')
    args.push(exePath)
    exePath = 'java'
  }

  return await launchExecutable(exePath, args, opts)
}
