
import Promise from 'bluebird'

import invariant from 'invariant'
import ospath from 'path'

import sf from '../../util/sf'

import {sortBy} from 'underline'

import mklog from '../../util/log'
const log = mklog('launch/poker')

const chatty = process.env.POKER_POKER_ON_THE_WALL === '1'

export default async function poke (opts) {
  const {cave, appPath} = opts
  invariant(typeof cave === 'object', 'poker needs cave')
  invariant(typeof appPath === 'string', 'poker needs appPath')

  let candidates = cave.executables.map((path) => ({path}))
  log(opts, `initial candidate set: ${JSON.stringify(candidates, null, 2)}`)

  candidates = await computeWeight(appPath, candidates)
  candidates = computeScore(candidates)
  candidates = computeDepth(candidates)

  candidates = candidates::sortBy((x) => -x.weight)
  if (chatty) { log(opts, `candidates after weight sorting: ${JSON.stringify(candidates, null, 2)}`) }

  candidates = candidates::sortBy((x) => -x.score)
  if (chatty) { log(opts, `candidates after score sorting: ${JSON.stringify(candidates, null, 2)}`) }

  candidates = candidates::sortBy((x) => x.depth)
  if (chatty) { log(opts, `candidates after depth sorting: ${JSON.stringify(candidates, null, 2)}`) }

  if (candidates.length > 1) {
    // TODO: figure this out. We want to let people choose, but we also don't
    // want to confuse them — often there are 2 or 3 executables and the app already
    // picks the best way to start the game.
    log(opts, 'warning: more than one candidate, picking the one with the best score')
  }
  return ospath.join(appPath, candidates[0].path)
}

async function computeWeight (appPath, execs) {
  const output = []

  const f = async function (exe) {
    const exePath = ospath.join(appPath, exe.path)
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
    exe.depth = ospath.normalize(exe.path).split(ospath.sep).length
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
    if (/nacl_helper/i.test(exe.path)) {
      score -= 20
    }
    if (/nwjc\.exe$/i.test(exe.path)) {
      score -= 20
    }
    if (/flixel\.exe$/i.test(exe.path)) {
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
