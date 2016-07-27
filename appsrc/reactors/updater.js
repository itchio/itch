
import {EventEmitter} from 'events'
import invariant from 'invariant'
import humanize from 'humanize-plus'

import {getUserMarket, getGlobalMarket} from './market'
import delay from './delay'

import * as actions from '../actions'

import fetch from '../util/fetch'
import pathmaker from '../util/pathmaker'
import api from '../util/api'

import mklog from '../util/log'
const log = mklog('updater')
const opts = {
  logger: new mklog.Logger({
    sinks: {
      console: false,
      file: pathmaker.updaterLogPath()
    }
  })
}

import {startDownload} from './tasks/start-download'
import {findWhere, filter, map} from 'underline'

const DELAY_BETWEEN_GAMES = 25

// 30 minutes * 60 = seconds, * 1000 = millis
const DELAY_BETWEEN_PASSES = 20 * 60 * 1000
const DELAY_BETWEEN_PASSES_WIGGLE = 10 * 60 * 1000

import findUpload from '../tasks/find-upload'
import findUpgradePath from '../tasks/find-upgrade-path'

import moment from 'moment-timezone'

async function checkForGameUpdates (store, action) {
  const caves = getGlobalMarket().getEntities('caves')
  invariant(caves, 'has caves')

  for (const caveId of Object.keys(caves)) {
    try {
      await doCheckForGameUpdate(store, caves[caveId])
    } catch (e) {
      log(opts, `While checking for cave ${caveId} update: ${e.stack || e}`)
    }
    await delay(DELAY_BETWEEN_GAMES)
  }
}

async function checkForGameUpdate (store, action) {
  const {caveId, noisy = false} = action.payload
  if (noisy) {
    log(opts, `Looking for updates for cave ${caveId}`)
  }

  invariant(typeof caveId === 'string', 'caveId is a string')

  const cave = getGlobalMarket().getEntity('caves', caveId)
  if (!cave) {
    log(opts, `No cave with id ${caveId}, bailing out`)
    return
  }

  try {
    const result = await doCheckForGameUpdate(store, cave, {noisy})
    if (noisy) {
      if (result && result.err) {
        store.dispatch(actions.statusMessage(['status.game_update.check_failed', {err: result.err}]))
      } else if (result && result.hasUpgrade) {
        if (result.game) {
          store.dispatch(actions.statusMessage(['status.game_update.found', {title: result.game.title}]))
        }
      } else if (result && result.game) {
        store.dispatch(actions.statusMessage(['status.game_update.not_found', {title: result.game.title}]))
      }
    }
    if (result && noisy) {
      if (result.err) {
      }
    }
  } catch (e) {
    log(opts, `While checking for cave ${caveId} update: ${e.stack || e}`)
    if (noisy) {
      store.dispatch(actions.statusMessage(['status.game_update.check_failed', {err: e}]))
    }
  } finally {
    if (noisy) {
      log(opts, `Done looking for updates for cave ${caveId}`)
    }
  }
}

async function _doCheckForGameUpdate (store, cave, taskOpts = {}) {
  const {noisy = false} = taskOpts
  const returnVars = {}

  const credentials = store.getState().session.credentials
  invariant(credentials, 'has credentials')

  const {installedBy} = cave
  const {me} = credentials
  if (installedBy && me) {
    if (installedBy.id !== me.id) {
      log(opts, `${cave.id} was installed by ${installedBy.username}, we're ${me.username}, skipping check`)
      return {hasUpgrade: false}
    }
  }

  if (!cave.launchable) {
    log(opts, `Cave isn't launchable, skipping: ${cave.id}`)
    return {hasUpgrade: false}
  }

  if (!cave.gameId) {
    log(opts, `Cave lacks gameId, skipping: ${cave.id}`)
    return {hasUpgrade: false}
  }

  const market = getUserMarket()
  const globalMarket = getGlobalMarket()
  let game
  try {
    game = await fetch.gameLazily(market, credentials, cave.gameId)
  } catch (e) {
    log(opts, `Could not fetch game for ${cave.gameId}, skipping (${e.message || e})`)
    return {err: e}
  }
  returnVars.game = game
  returnVars.hasUpgrade = false

  const logger = new mklog.Logger({sinks: {console: false, string: true}})

  if (game) {
    log(opts, `Looking for updates to ${game.title}...`)
    const out = new EventEmitter()
    const findKey = () => market.getEntities('downloadKeys')::findWhere({gameId: game.id})
    const taskOpts = {
      ...opts,
      logger,
      game,
      gameId: game.id,
      credentials,
      downloadKey: cave.downloadKey || findKey(),
      market
    }

    try {
      const {uploads, downloadKey} = await findUpload(out, taskOpts)

      if (uploads.length === 0) {
        log(opts, `Can't check for updates for ${game.title}, no uploads.`)
        logger.contents.trimRight().split('\n').map((line) => log(opts, `> ${line}`))
        return {err: 'No uploads found'}
      }

      // TODO: update installedAt once we found there were no new uploads?
      let installedAt = moment.tz(cave.installedAt, 'UTC')
      log(opts, `installed at ${installedAt.format()}`)
      if (!installedAt.isValid()) {
        installedAt = moment.tz(0, 'UTC')
      }
      const recentUploads = uploads::filter((upload) => {
        const updatedAt = moment.tz(upload.updatedAt, 'UTC')
        const isRecent = updatedAt > installedAt
        if (!isRecent) {
          log(opts, `Filtering out ${upload.filename} (#${upload.id}), ${updatedAt.format()} is older than ${installedAt.format()}`)
        }
        return isRecent
      })
      log(opts, `${uploads.length} available uploads, ${recentUploads.length} are more recent`)

      let hasUpgrade = false

      if (cave.uploadId && cave.buildId) {
        log(opts, `Looking for new builds of ${game.title}, from build ${cave.buildId}`)
        const upload = uploads::findWhere({id: cave.uploadId})
        if (!upload || !upload.buildId) {
          log(opts, 'Uh oh, our wharf-enabled upload disappeared')
        } else {
          if (upload.buildId !== cave.buildId) {
            log(opts, `Got new build available: ${upload.buildId} > ${cave.buildId}`)
            if (noisy) {
              store.dispatch(actions.statusMessage(['status.game_update.found', {title: game.title}]))
            }

            hasUpgrade = true

            const upgradeOpts = {
              ...taskOpts,
              upload,
              gameId: game.id,
              currentBuildId: cave.buildId
            }
            try {
              const {upgradePath, totalSize} = await findUpgradePath(out, upgradeOpts)
              log(opts, `Got ${upgradePath.length} patches to download, ${humanize.fileSize(totalSize)} total`)
              const archivePath = pathmaker.downloadPath(upload)

              await startDownload(store, {
                game,
                gameId: game.id,
                upload,
                destPath: archivePath,
                downloadKey,
                reason: 'update',
                incremental: true,
                globalMarket,
                upgradePath,
                totalSize,
                cave
              })
              return {...returnVars, hasUpgrade}
            } catch (e) {
              log(opts, `While getting upgrade path: ${e.message || e}`)
              return {err: e.message}
            }
          }
        }
      }

      if (recentUploads.length === 0) {
        log(opts, `No recent uploads for ${game.title}, update check done`)
        return returnVars
      }

      if (recentUploads.length > 1) {
        log(opts, 'More than one recent upload, asking user to pick')

        const {title} = game
        store.dispatch(actions.openModal({
          title: ['pick_update_upload.title', {title}],
          message: ['pick_update_upload.message', {title}],
          detail: ['pick_update_upload.detail'],
          bigButtons: recentUploads::map((upload) => {
            const archivePath = pathmaker.downloadPath(upload)
            return {
              label: `${upload.displayName || upload.filename} (${humanize.fileSize(upload.size)})`,
              timeAgo: {
                label: ['prompt.updated_ago'],
                date: Date.parse(upload.updatedAt)
              },
              action: actions.queueDownload({
                game,
                gameId: game.id,
                upload,
                totalSize: upload.size,
                destPath: archivePath,
                downloadKey,
                handPicked: true,
                reason: 'update'
              }),
              icon: 'download'
            }
          }),
          buttons: [
            'cancel'
          ]
        }))

        return {...returnVars, hasUpgrade: true}
      }

      const upload = recentUploads[0]
      const differentUpload = upload.id !== cave.uploadId
      const wentWharf = upload.buildId && !cave.buildId

      if (hasUpgrade || differentUpload || wentWharf) {
        log(opts, `Got a new upload for ${game.title}: ${upload.filename}`)
        if (hasUpgrade) {
          log(opts, '(Reason: forced)')
        }
        if (differentUpload) {
          log(opts, '(Reason: different upload)')
        }
        if (wentWharf) {
          log(opts, '(Reason: went wharf)')
        }

        const archivePath = pathmaker.downloadPath(upload)

        await startDownload(store, {
          game,
          gameId: game.id,
          upload,
          handPicked: false,
          totalSize: upload.size,
          destPath: archivePath,
          downloadKey,
          reason: 'update'
        })
        return {...returnVars, hasUpgrade}
      }
    } catch (e) {
      if (api.hasAPIError(e, 'incorrect user for claim')) {
        log(opts, `Skipping update check for ${game.title}, download key belongs to other user`)
      } else if (api.isNetworkError(e)) {
        log(opts, `Skipping update check for ${game.title}: we're offline`)
        return {err: new Error(`Network error (${e.code})`)}
      } else {
        log(opts, `While looking for update: ${e.stack || e}`)
        log(opts, `Error object: ${JSON.stringify(e, 0, 2)}`)
        return {err: e}
      }
    }
  } else {
    log(opts, `Can't check for updates for ${game.title}, not visible by current user?`)
  }

  return returnVars
}

async function doCheckForGameUpdate (store, cave, taskOpts = {}) {
  try {
    return await _doCheckForGameUpdate(store, cave, taskOpts)
  } catch (e) {
    if (e.code && e.code === 'ENOTFOUND') {
      log(opts, 'Offline, skipping update check')
    } else {
      throw e
    }
  }
}

let updaterInstalled = false

async function sessionReady (store, action) {
  if (updaterInstalled) {
    return
  }
  updaterInstalled = true

  while (true) {
    log(opts, 'Regularly scheduled check for game updates...')
    store.dispatch(actions.checkForGameUpdates())
    await delay(DELAY_BETWEEN_PASSES + Math.random() * DELAY_BETWEEN_PASSES_WIGGLE)
  }
}

export default {sessionReady, checkForGameUpdates, checkForGameUpdate}
