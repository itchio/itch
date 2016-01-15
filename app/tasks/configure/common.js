
let sniff = require('../../util/sniff')
let sf = require('../../util/sf')
let os = require('../../util/os')

let _ = require('underscore')
let path = require('path')

let field = os.platform() === 'darwin' ? 'mac_executable' : 'linux_executable'

/**
 * Tries to find executables by sniffing file contents,
 * +x them, and return a list of them
 */
function fix_execs (base_path) {
  let f = _.partial(sniff_and_chmod, base_path)

  return (
    sf.glob(`**`, {nodir: true, cwd: base_path})
    .map(f, {concurrency: 2})
    .filter((x) => !!x)
  )
}

async function sniff_and_chmod (base, rel) {
  let file = path.join(base, rel)

  let type = await sniff.path(file)
  if (type && type[field]) {
    await sf.chmod(file, 0o777)
    return rel
  }
}

module.exports = {fix_execs}
