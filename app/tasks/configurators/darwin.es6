
import common from './common'
import glob from '../../util/glob'

// skip some typical junk we find in archives that's supposed
// to be hidden / in trash / isn't in anyway relevant to what
// we're trying to do
function skip_junk (bundle_paths) {
  return bundle_paths.filter((file) => !/__MACOSX/.test(file))
}

function configure (install_path) {
  // gotcha: return '.app' bundles, not actual Mach-O executables
  return (
    glob(`${install_path}/**/*.app/`)
    .then(skip_junk)
    .each(common.fix_execs)
    .then((executables) => ({executables}))
  )
}

export default { configure }
