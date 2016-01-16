
let Promise = require('bluebird')
let path = require('path')

let common = require('./common')
let sf = require('../../util/sf')

let ignore_patterns = [
  // skip some typical junk we find in archives that's supposed
  // to be hidden / in trash / isn't in anyway relevant to what
  // we're trying to do
  '**/__MACOSX/**'
]

let self = {
  configure: async function (cave_path) {
    let bundles = await sf.glob(`**.app/`, {
      cwd: cave_path,
      ignore: ignore_patterns
    })

    if (bundles.length) {
      let fixer = (x) => common.fix_execs('mac_executable', path.join(cave_path, x))
      await Promise.each(bundles, fixer)
      return {executables: bundles}
    }

    // some games aren't properly packaged app bundles but rather a shell
    // script / binary - try it the linux way
    let executables = await common.fix_execs('mac_executable', cave_path)
    return {executables}
  }
}

module.exports = self
