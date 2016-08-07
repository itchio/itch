
import Promise from 'bluebird'

import invariant from 'invariant'
import ospath from 'path'

import sf from '../../util/sf'

import {sortBy} from 'underline'

import mklog from '../../util/log'
const log = mklog('launch/poker')

export default async function poke (opts) {
  const {cave, appPath} = opts
  invariant(typeof cave === 'object', 'poker needs cave')
  invariant(typeof appPath === 'string', 'poker needs appPath')

  let candidates = cave.executables.map((path) => ({path}))
  log(opts, `initial candidate set: ${JSON.stringify(candidates, null, 2)}`)

  candidates = await computeWeight(opts, appPath, candidates)
  candidates = computeScore(candidates)
  candidates = computeDepth(candidates)
  log(opts, `candidates after poking: ${JSON.stringify(candidates, null, 2)}`)

  candidates = candidates::sortBy((x) => -x.weight)
  candidates = candidates::sortBy((x) => -x.score)
  candidates = candidates::sortBy((x) => x.depth)
  log(opts, `candidates after sorting: ${JSON.stringify(candidates, null, 2)}`)

  if (candidates.length > 1) {
    // TODO: figure this out. We want to let people choose, but we also don't
    // want to confuse them — often there are 2 or 3 executables and the app already
    // picks the best way to start the game.
    log(opts, 'warning: more than one candidate, picking the one with the best score')
  }
  const candidate = candidates[0]

  if (candidate) {
    return ospath.join(appPath, candidate.path)
  }
}

async function computeWeight (opts, appPath, execs) {
  const output = []

  const f = async function (exe) {
    const exePath = ospath.join(appPath, exe.path)
    let stats
    try {
      stats = await sf.stat(exePath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        // entering the ultra hat dimension
        log(opts, `candidate disappeared: ${exePath}`)
      }
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

    const name = ospath.basename(exe.path)

    if (/unins.*\.exe$/i.test(name)) {
      score -= 50
    }
    if (/^kick\.bin$/i.test(name)) {
      score -= 50
    }
    if (/nacl_helper/i.test(name)) {
      score -= 20
    }
    if (/nwjc\.exe$/i.test(name)) {
      score -= 20
    }
    if (/flixel\.exe$/i.test(name)) {
      score -= 20
    }
    if (/dxwebsetup\.exe$/i.test(name)) {
      score = 0
    }
    if (/vcredist.*\.exe$/i.test(name)) {
      score = 0
    }
    if (/\.(so|dylib)/.test(name)) {
      score = 0
    }
    if (/\.sh$/.test(name)) {
      score += 20
    }
    if (/\.jar$/.test(name)) {
      // launcher scripts > jar, in case of bundled JRE, cf. https://github.com/itchio/itch/issues/819
      score -= 5
    }
    exe.score = score

    if (score > 0) {
      output.push(exe)
    }
  }

  return output
}
