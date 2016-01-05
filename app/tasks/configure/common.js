
let sniff = require('../../util/sniff')
let glob = require('../../promised/glob')
let fs = require('../../promised/fs')

let _ = require('underscore')
let path = require('path')

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
function fix_execs (base_path) {
  let f = _.partial(sniff_and_chmod, base_path)

  return (
    glob(`**/*`, {nodir: true, cwd: base_path})
    .map(f, {concurrency: 2})
    .filter((x) => !!x)
  )
}

async function sniff_and_chmod (base, rel) {
  let file = path.join(base, rel)

  let type = await sniff.path(file)
  if (type && type.executable) {
    await fs.chmodAsync(file, 0o777)
    return rel
  }
}

module.exports = {fix_execs}
