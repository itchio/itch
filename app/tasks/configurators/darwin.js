'use nodent';'use strict'

let Promise = require('bluebird')

let common = require('./common')
let glob = require('../../promised/glob')

let self = {
  // skip some typical junk we find in archives that's supposed
  // to be hidden / in trash / isn't in anyway relevant to what
  // we're trying to do
  skip_junk: function (bundle_paths) {
    return bundle_paths.filter((file) => !/__MACOSX/.test(file))
  },

  configure: async function (cave_path) {
    let bundles = await glob(`${cave_path}/**/*.app/`).then(self.skip_junk)

    if (bundles.length > 0) {
      await Promise.each(bundles, common.fix_execs)
      return {executables: bundles}
    }

    // some games aren't properly packaged app bundles but rather a shell
    // script / binary - try it the linux way
    let executables = await common.fix_execs(cave_path)
    return {executables}
  }
}

module.exports = self
