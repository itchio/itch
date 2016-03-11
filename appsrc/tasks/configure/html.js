
import path from 'path'
import clone from 'clone'
import {getIn} from 'grovel'

import sf from '../../util/sf'

export const indexBonus = (path) => /index\.html$/.test(path) ? 2 : 0

const self = {
  sortByDepth: function (paths) {
    const depths = {}
    for (const p of paths) {
      depths[p] = path.normalize(p).split(path.sep).length
    }
    return clone(paths).sort((a, b) => depths[a] - depths[b] + indexBonus(a) - indexBonus(b))
  },

  configure: async function (game, cavePath) {
    pre: { // eslint-disable-line
      typeof game === 'object'
      typeof cavePath === 'string'
    }

    const indexEntryPoints = await sf.glob('**/index.html', {cwd: cavePath})
    const otherEntryPoints = await sf.glob('**/*.html', {cwd: cavePath})
    const entryPoints = self.sortByDepth(indexEntryPoints.concat(otherEntryPoints))

    const gamePath = entryPoints[0]
    const windowSize = {
      width: game::getIn(['embed', 'width']) || 1280,
      height: game::getIn(['embed', 'height']) || 720,
      fullscreen: game::getIn(['embed', 'fullscreen']) || true
    }
    return {gamePath, windowSize}
  }
}

export default self
