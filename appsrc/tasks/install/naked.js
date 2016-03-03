
import sf from '../../util/sf'

import path from 'path'

import mklog from '../../util/log'
const log = mklog('installers/naked')

const self = {
  install: async function (opts) {
    const archive_path = opts.archive_path
    const dest_path = opts.dest_path

    await sf.mkdir(dest_path)

    const dest_file_path = path.join(dest_path, path.basename(archive_path))
    log(opts, `copying ${archive_path} to ${dest_file_path}`)

    await sf.ditto(archive_path, dest_file_path)
  },

  uninstall: async function (opts) {
    const dest_path = opts.dest_path

    log(opts, `nuking ${dest_path}`)
    await sf.wipe(dest_path)
  }
}

export default self
