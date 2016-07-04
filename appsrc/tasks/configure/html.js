
import path from 'path'
import clone from 'clone'

import sf from '../../util/sf'

import mklog from '../../util/log'
import {opts} from '../../logger'
const log = mklog('configure/html')

import {sortBy, uniq} from 'underline'

export const indexBonus = (path) => {
  return /index\.html$/.test(path) ? 2 : 0
}

const self = {
  sortEntryPoints: function (paths) {
    const original = clone(paths)::uniq()
    const depths = {}
    for (const p of original) {
      depths[p] = path.normalize(p).split(path.sep).length
    }

    const sortedByIndex = original::sortBy((p) => -indexBonus(p))
    const sortedByDepth = sortedByIndex::sortBy((p) => depths[p])
    return sortedByDepth
  },

  getGamePath: async function (cavePath) {
    const entryPoints = await sf.glob('**/*.html', {cwd: cavePath})
    const sortedEntryPoints = self.sortEntryPoints(entryPoints)
    return sortedEntryPoints[0]
  },

  configure: async function (game, cavePath) {
    pre: { // eslint-disable-line
      typeof game === 'object'
      typeof cavePath === 'string'
    }

    const gamePath = await self.getGamePath(cavePath)

    const {embed = {}} = game
    const {width = 1280, height = 720, fullscreen = true} = embed
    log(opts, `Game settings: ${width}x${height}, fullscreen = ${fullscreen}`)

    const windowSize = {
      width, height, fullscreen
    }
    return {gamePath, windowSize}
  }
}

export default self
