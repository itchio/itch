
// import configure from './configure'
import invariant from 'invariant'

import native from './launch/native'
import html from './launch/html'

import store from '../store'
import {startTask} from '../reactors/tasks/start-task'

import mklog from '../util/log'
const log = mklog('tasks/launch')

import fetch from '../util/fetch'
import pathmaker from '../util/pathmaker'
import explorer from '../util/explorer'
import classificationActions from '../constants/classification-actions'

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
  const {globalMarket, preferences, market, credentials} = opts
  let {cave} = opts
  invariant(cave, 'launch has cave')
  invariant(globalMarket, 'launch has globalMarket')
  invariant(credentials, 'launch has credentials')
  invariant(market, 'launch has market')
  invariant(preferences, 'launch has preferences')

  const game = await fetch.gameLazily(market, credentials, cave.gameId)

  const action = classificationActions[(cave.game || {}).classification || 'game']
  if (action === 'open') {
    globalMarket.saveEntity('caves', cave.id, {lastTouched: Date.now()})
    explorer.open(pathmaker.appPath(cave))
    return
  }

  const {launchType = 'native'} = cave

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

  const launcher = {native, html}[launchType]
  if (!launcher) {
    throw new Error(`Unsupported launch type '${cave.launchType}'`)
  }

  problem = caveProblem(cave)
  if (problem) {
    // FIXME: this swallows the problem.
    const err = new Error(`game.install.could_not_launch (${problem})`)
    err.reason = problem
    throw err
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
    await launcher(out, opts)
  } finally {
    clearInterval(interval)
    const now = Date.now()
    globalMarket.saveEntity('caves', cave.id, {lastTouched: now})
  }
}
