
import glob from '../../util/glob'
import sniff from '../../util/sniff'
import fs from '../../util/fs'

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
function fix_execs (base_path) {
  return (
    glob(`${base_path}/**/*`, {nodir: true})
    .map(sniff_and_chmod, {concurrency: 4})
    .filter((x) => !!x)
  )
}

function sniff_and_chmod (file) {
  return sniff.path(file).then((format) => {
    if (!format) return
    return (
      fs.chmodAsync(file, 0o777)
      .then(() => file)
    )
  })
}

export default { fix_execs }
