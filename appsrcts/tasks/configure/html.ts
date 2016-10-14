
import * as path from 'path'
import * as clone from 'clone'

import sf from '../../util/sf'

// import mklog from '../../util/log'
// import {opts} from '../../logger'
const {opts} = require('../../logger')
const mklog = require('../../util/log').default
const log = mklog('configure/html')

import {sortBy, uniq} from 'underscore'

import {GameRecord, GameEmbedInfo} from '../../types/db'

export const indexBonus = (path) => {
  return /index\.html$/.test(path) ? 2 : 0
}

export interface HTMLConfigureResult {
  gamePath: string
  windowSize: {
    width: number
    height: number
    fullscreen: boolean
  }
}

const self = {
  sortEntryPoints: function (paths: Array<string>) {
    const original = uniq(clone(paths))
    const depths = {} as Map<string, number>
    for (const p of original) {
      depths[p] = path.normalize(p).split(path.sep).length
    }

    const sortedByIndex = sortBy(original, (p) => -indexBonus(p))
    const sortedByDepth = sortBy(sortedByIndex, (p) => depths[p])
    return sortedByDepth
  },

  getGamePath: async function (cavePath) {
    const entryPoints = await sf.glob('**/*.html', {cwd: cavePath})
    const sortedEntryPoints = self.sortEntryPoints(entryPoints)
    return sortedEntryPoints[0]
  },

  configure: async function (game: GameRecord, cavePath: string): Promise<HTMLConfigureResult> {
    const gamePath = await self.getGamePath(cavePath)

    const {embed = {} as GameEmbedInfo} = game
    const {width = 1280, height = 720, fullscreen = true} = embed
    log(opts, `Game settings: ${width}x${height}, fullscreen = ${fullscreen}`)

    const windowSize = {
      width, height, fullscreen
    }
    return {gamePath, windowSize}
  }
}

export default self
