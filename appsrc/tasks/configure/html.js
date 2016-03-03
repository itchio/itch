
import path from 'path'
import clone from 'clone'

import sf from '../../util/sf'

let self = {
  sort_by_depth: function (paths) {
    let depths = {}
    for (let p of paths) {
      depths[p] = path.normalize(p).split(path.sep).length
    }
    let index_bonus = (path) => /index\.html$/.test(path) ? 2 : 0
    return clone(paths).sort((a, b) => depths[a] - depths[b] + index_bonus(a) - index_bonus(b))
  },
  configure: async function (cave_path) {
    let entry_points = await sf.glob('**/index.html', {
      cwd: cave_path
    })
    let other_entry_points = await sf.glob('**/*.html', {
      cwd: cave_path
    })
    entry_points = self.sort_by_depth(entry_points.concat(other_entry_points))

    let game_path = entry_points[0]
    let window_size = {width: 1280, height: 720} // TODO fetch window size
    return {game_path, window_size}
  }
}

export default self
