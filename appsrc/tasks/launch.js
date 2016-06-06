
// import configure from './configure'
import invariant from 'invariant'

import native from './launch/native'
import html from './launch/html'

import pathmaker from '../util/pathmaker'
import explorer from '../util/explorer'
import classificationActions from '../constants/classification-actions'

function caveProblem (cave) {
  switch (cave.launchType) {
    case 'native':
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
  const {globalMarket, preferences} = opts
  let {cave} = opts
  invariant(cave, 'launch has cave')
  invariant(globalMarket, 'launch has globalMarket')
  invariant(preferences, 'launch has preferences')

  const action = classificationActions[(cave.game || {}).classification || 'game']
  if (action === 'open') {
    globalMarket.saveEntity('caves', cave.id, {lastTouched: Date.now()})
    explorer.open(pathmaker.appPath(cave))
    return
  }

  const {launchType = 'native'} = cave

  if (caveProblem(cave)) {
    // FIXME: figure out subtasks
    // await configure(out, opts)
    // cave = globalMarket.getEntities('caves')[cave.id]
    console.log('should configure: stub')
  }

  const launcher = {native, html}[launchType]
  if (!launcher) {
    throw new Error(`Unsupported launch type '${cave.launchType}'`)
  }

  const problem = caveProblem(cave)
  if (problem) {
    const err = new Error('game.install.could_not_launch')
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
