
import path from 'path'
import clone from 'clone'
import {getIn} from 'grovel'

import sf from '../../util/sf'

const self = {
  sort_by_depth: function (paths) {
    const depths = {}
    for (const p of paths) {
      depths[p] = path.normalize(p).split(path.sep).length
    }
    const index_bonus = (path) => /index\.html$/.test(path) ? 2 : 0
    return clone(paths).sort((a, b) => depths[a] - depths[b] + index_bonus(a) - index_bonus(b))
  },

  configure: async function (game, cave_path) {
    pre: { // eslint-disable-line
      typeof game === 'object'
      typeof cave_path === 'string'
    }

    const index_entry_points = await sf.glob('**/index.html', {
      cwd: cave_path
    })
    const other_entry_points = await sf.glob('**/*.html', {
      cwd: cave_path
    })
    const entry_points = self.sort_by_depth(index_entry_points.concat(other_entry_points))

    const game_path = entry_points[0]
    const window_size = {
      width: parseInt(game::getIn(['embed', 'width']) || 1280, 10),
      height: parseInt(game::getIn(['embed', 'height']) || 720, 10),
      fullscreen: game::getIn(['embed', 'fullscreen']) || true
    }
    return {game_path, window_size}
  }
}

export default self
