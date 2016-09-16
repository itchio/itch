
import fnout from 'fnout'
import ospath from 'path'
import toml from 'toml'

import invariant from 'invariant'

import native from './launch/native'
import html from './launch/html'
import shell from './launch/shell'
import external from './launch/external'
import validateManifest from './launch/validate-manifest'

import store from '../store'
import * as actions from '../actions'
import {startTask} from '../reactors/tasks/start-task'

import mklog from '../util/log'
const log = mklog('tasks/launch')

import diego from '../util/diego'
import api from '../util/api'
import os from '../util/os'
import sf from '../util/sf'
import fetch from '../util/fetch'
import pathmaker from '../util/pathmaker'
import explorer from '../util/explorer'
import classificationActions from '../constants/classification-actions'
import defaultManifestIcons from '../constants/default-manifest-icons'

import {promisedModal} from '../reactors/modals'
import {MODAL_RESPONSE} from '../constants/action-types'

import spawn from '../util/spawn'

import {app} from '../electron'

import {find, findWhere, each} from 'underline'

import {Crash} from './errors'

function caveProblem (cave) {
  switch (cave.launchType) {
    case 'native':
      // FIXME: this isn't an issue if we have a manifest
      if (!cave.executables || cave.executables.length === 0) {
        return ['game.install.no_executables_found']
      }
      break
    case 'html':
      if (!cave.gamePath) {
        return ['game.install.no_html_index_found']
      }
      break
  }
}

export default async function start (out, opts) {
  const {cave} = opts

  const caveLogPath = pathmaker.caveLogPath(cave.id)
  const gameLogger = new mklog.Logger({
    sinks: {
      console: true,
      file: caveLogPath
    }
  })
  const gameOpts = {
    ...opts,
    logger: gameLogger
  }

  try {
    return await doStart(out, gameOpts)
  } catch (e) {
    const {cave, market, credentials} = opts
    const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game})

    log(gameOpts, `crashed with ${e.message}`)
    log(gameOpts, e.stack)
    await diego.hire(gameOpts)

    store.dispatch(actions.openModal({
      title: '',
      message: ['game.install.could_not_launch', {title: game.title}],
      detail: ['game.install.could_not_launch.detail', {error: e.message}],
      buttons: [
        {
          label: ['grid.item.report_problem'],
          icon: 'upload-to-cloud',
          action: actions.reportCave({caveId: cave.id})
        },
        {
          label: ['grid.item.probe'],
          icon: 'bug',
          className: 'secondary',
          action: actions.probeCave({caveId: cave.id})
        },
        'cancel'
      ]
    }))
  } finally {
    gameLogger.close()
  }
}

export async function doStart (out, opts) {
  const {globalMarket, preferences, market, credentials} = opts
  let {cave} = opts
  invariant(cave, 'launch has cave')
  invariant(globalMarket, 'launch has globalMarket')
  invariant(credentials, 'launch has credentials')
  invariant(market, 'launch has market')
  invariant(preferences, 'launch has preferences')

  const gameOpts = {...opts}

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game})

  const action = classificationActions[(cave.game || {}).classification || 'game']
  if (action === 'open') {
    globalMarket.saveEntity('caves', cave.id, {lastTouched: Date.now()})
    explorer.open(pathmaker.appPath(cave))
    return
  }

  let {launchType = 'native'} = cave

  let problem = caveProblem(cave)
  if (problem) {
    log(opts, `reconfiguring because of problem with cave: ${problem}`)
    await startTask(store, {
      name: 'configure',
      gameId: game.id,
      game,
      cave,
      upload: cave.uploads[cave.uploadId]
    })
    cave = globalMarket.getEntities('caves')[cave.id]
  }

  problem = caveProblem(cave)
  if (problem) {
    // FIXME: this swallows the problem.
    const err = new Error(`game.install.could_not_launch (${problem})`)
    err.reason = problem
    throw err
  }

  log(gameOpts, `itch ${app.getVersion()} launching game ${game.id}: ${game.title}`)

  const env = {}
  const args = []
  const appPath = pathmaker.appPath(cave)
  const manifestPath = ospath.join(appPath, '.itch.toml')
  log(gameOpts, `looking for manifest @ "${manifestPath}"`)
  const hasManifest = await sf.exists(manifestPath)
  let manifestAction

  if (hasManifest) {
    log(gameOpts, 'found manifest, parsing')

    let manifest
    try {
      const contents = await sf.readFile(manifestPath)
      manifest = toml.parse(contents)
    } catch (e) {
      log(gameOpts, `error reading manifest: ${e}`)
      throw e
    }

    log(gameOpts, `manifest:\n ${JSON.stringify(manifest, 0, 2)}`)
    validateManifest(manifest, log, gameOpts)

    if (manifest.actions.length > 1) {
      if (opts.manifestActionName) {
        manifestAction = manifest.actions::findWhere({name: opts.manifestActionName})
        if (!action) {
          log(gameOpts, `Picked invalid manifest action: ${opts.manifestActionName}, had: ${JSON.stringify(manifest.actions, 0, 2)}`)
          return
        }
      } else {
        const buttons = []
        const bigButtons = []
        manifest.actions::each((action, i) => {
          if (!action.name) {
            throw new Error(`in manifest, action ${i} is missing a name`)
          }
          bigButtons.push({
            label: [`action.name.${action.name}`, {defaultValue: action.name}],
            action: actions.modalResponse({manifestActionName: action.name}),
            icon: action.icon || defaultManifestIcons[action.name] || 'star',
            className: `action-${action.name}`
          })
        })

        buttons.push('cancel')

        const response = await promisedModal(store, {
          title: game.title,
          cover: game.stillCoverUrl || game.coverUrl,
          message: '',
          bigButtons,
          buttons
        })
        console.log(`got response from promisedModal: ${JSON.stringify(response, 0, 2)}`)

        if (response.type === MODAL_RESPONSE) {
          manifestAction = manifest.actions::findWhere({name: response.payload.manifestActionName})
        } else {
          return // cancelled by user
        }
      }
    } else {
      manifestAction = manifest.actions[0]
    }
  } else {
    log(gameOpts, 'No manifest found (no \'.itch.toml\' file in top-level directory). Proceeding with heuristics.')
  }

  if (manifestAction) {
    manifestAction.path = manifestAction.path.replace(/{{EXT}}/, appExt())
    launchType = await launchTypeForAction(appPath, manifestAction.path)

    if (manifestAction.scope) {
      log(opts, `Requesting subkey with scope: ${manifestAction.scope}`)
      const client = api.withKey(credentials.key)
      const subkey = await client.subkey(game.id, manifestAction.scope)
      log(opts, `Got subkey (${subkey.key.length} chars, expires ${subkey.expires_at})`)
      env.ITCHIO_API_KEY = subkey.key
      env.ITCHIO_API_KEY_EXPIRES_AT = subkey.expiresAt
    }

    if (manifestAction.args) {
      manifestAction.args::each((arg) => {
        args.push(arg)
      })
    }
  }

  gameOpts.manifestAction = manifestAction
  gameOpts.env = env
  gameOpts.args = args

  const launcher = {native, html, shell, external}[launchType]
  if (!launcher) {
    throw new Error(`Unsupported launch type '${cave.launchType}'`)
  }

  if (os.itchPlatform() === 'windows') { // temp UE4 hack
    const {installedUE4Prereq} = globalMarket.getEntity('caves', cave.id)
    if (!installedUE4Prereq) {
      log(opts, 'looking for UE4 prereq setup')
      try {
        const executables = globalMarket.getEntity('caves', cave.id).executables
        const reqFile = executables::find((x) => /UE4PrereqSetup(_x64)?.exe/i.test(x))

        if (reqFile) {
          log(opts, `launching installer ${reqFile}`)
          const reqOpts = {...gameOpts}
          reqOpts.manifestAction = {path: reqFile, sandbox: false}
          const code = await spawn({
            command: ospath.join(appPath, reqFile),
            args: ['/quiet', '/norestart'],
            onToken: (tok) => log(opts, `[ue4 prereq out] ${tok}`),
            onErrToken: (tok) => log(opts, `[ue4 prereq err] ${tok}`)
          })
          if (code === 0) {
            log(opts, `succesfully installed UE4 prereq`)
            globalMarket.saveEntity('caves', cave.id, {installedUE4Prereq: true})
          } else {
            log(opts, `couldn't install UE4 prereq (exit code ${code})`)
          }
        }
      } catch (e) {
        log(opts, `error while launching prereq for ${cave.id}: ${e.stack || e}`)
      }
    }
  }

  const startedAt = Date.now()
  globalMarket.saveEntity('caves', cave.id, {lastTouched: startedAt})

  let interval
  const UPDATE_PLAYTIME_INTERVAL = 10
  try {
    interval = setInterval(() => {
      const now = Date.now()
      const previousSecondsRun = globalMarket.getEntity('caves', cave.id).secondsRun || 0
      const newSecondsRun = UPDATE_PLAYTIME_INTERVAL + previousSecondsRun
      globalMarket.saveEntity('caves', cave.id, {secondsRun: newSecondsRun, lastTouched: now})
    }, UPDATE_PLAYTIME_INTERVAL * 1000)
    await launcher(out, gameOpts)
  } catch (e) {
    log(opts, `error while launching ${cave.id}: ${e.stack || e}`)
    if (e instanceof Crash) {
      const secondsRunning = (Date.now() - startedAt) / 1000
      if (secondsRunning > 10) {
        // looks like the game actually launched fine!
        log(opts, `Game was running for ${secondsRunning} seconds, ignoring: ${e.toString()}`)
        return
      }
    }
    throw e
  } finally {
    clearInterval(interval)
    const now = Date.now()
    globalMarket.saveEntity('caves', cave.id, {lastTouched: now})
  }
}

async function launchTypeForAction (appPath, actionPath) {
  if (/.(app|exe|bat|sh)$/i.test(actionPath)) {
    return 'native'
  }

  if (/.html?$/i.test(actionPath)) {
    return 'html'
  }

  if (/^https?:/i.test(actionPath)) {
    return 'external'
  }

  const platform = os.itchPlatform()

  const fullPath = ospath.join(appPath, actionPath)
  const sniffRes = await fnout.path(fullPath)
  if ((sniffRes.linuxExecutable && platform === 'linux') ||
      (sniffRes.macExecutable && platform === 'osx')) {
    return 'native'
  }

  return 'shell'
}

function appExt () {
  switch (os.itchPlatform()) {
    case 'osx': return '.app'
    case 'windows': return '.exe'
    default: return ''
  }
}
