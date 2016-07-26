
// going through sf to access original-fs when running via Electron
import sf from './sf'

import invariant from 'invariant'
import tar from 'tar'
import zlib from 'zlib'

async function extract (opts) {
  const {archivePath, destPath} = opts
  invariant(typeof archivePath === 'string', 'targz.extract needs string archivePath')
  invariant(typeof destPath === 'string', 'targz.extract needs string destPath')

  const untar = tar.Extract(destPath)
  var src = sf.fs.createReadStream(archivePath)

  src.pipe(zlib.createGunzip()).pipe(untar)
  return await sf.promised(untar)
}

export default {extract}
