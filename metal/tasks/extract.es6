
import schema from 'validate'
import read_chunk from 'read-chunk'
import file_type from 'file-type'
import Promise from 'bluebird'

let log = require('../util/log')('extractor')

let extract_schema = schema({
  archive_path: { type: 'string' },
  dest_path: { type: 'string' },
  onprogress: { type: 'function' }
})

export function extract (opts) {
  extract_schema.assert(opts)

  let {archive_path} = opts
  let buffer = read_chunk.sync(archive_path, 0, 262)
  let type = file_type(buffer)

  if (!type) return Promise.reject(`Can't determine type of archive ${archive_path}`)

  log(opts, `Type of ${archive_path}: ${JSON.stringify(type)}`)

  switch (type.ext) {
    case 'zip':
    case 'gz':
    case 'bz2':
    case '7z':
      return require('./extractors/7zip').extract(opts)
    default:
      return Promise.reject(`Don't know how to extract ${archive_path} / ${JSON.stringify(type)}`)
  }
}

export default { extract }
