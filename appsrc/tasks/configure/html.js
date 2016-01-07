
let Promise = require('bluebird')
let path = require('path')
let clone = require('clone')

let common = require('./common')
let sf = require('../../util/sf')

let self = {
	sort_by_depth: function (paths) {
		let depths = {}
		for (let p of paths) {
			depths[p] = path.normalize(p).split(path.sep).length
		}
		return clone(paths).sort((a, b) => depths[a] - depths[b])
	},
  configure: async function (cave_path) {
    let entry_points = await sf.glob('**/index.html', {
      cwd: cave_path
    })
		if (!entry_points) {
			return {game_root: null, window_size: null}
		}
		entry_points = self.sort_by_depth(entry_points)
    let game_root = path.dirname(entry_points[0])
		let window_size = {width: 1280, height: 720} // TODO fetch window size
		return {game_root, window_size}
  }
}

module.exports = self
