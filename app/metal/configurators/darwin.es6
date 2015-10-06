
import Promise from 'bluebird'
import path from 'path'

let fs = Promise.promisifyAll(require('fs'))
let glob = Promise.promisify(require('glob'))
let read_chunk = Promise.promisify(require('read-chunk'))

function log (msg) {
  console.log(`[configurators/drawin] ${msg}`)
}

// skip some typical junk we find in archives that's supposed
// to be hidden / in trash / isn't in anyway relevant to what
// we're trying to do
function skip_junk (bundle_paths, app_path) {
  return bundle_paths.filter((file) => {
    return !/^__MACOSX/.test(path.relative(app_path, file))
  })
}

function sniff_format (buf) {
  // intel Mach-O executables start with 0xCEFAEDFE
  // (old PowerPC Mach-O executables started with 0xFEEDFACE)
  if (buf[0] === 0xCE && buf[1] === 0xFA && buf[2] === 0xED && buf[3] === 0xFE) {
    return 'mach-o executable'
  }

  // Mach-O universal binaries start with 0xCAFEBABE
  // it's Apple's 'fat binary' stuff that contains multiple architectures
  if (buf[0] === 0xCA && buf[1] === 0xFE && buf[2] === 0xBA && buf[3] === 0xBE) {
    return 'mach-o universal binary'
  }

  // Shell-script start with an interro-bang
  if (buf[0] === 0x23 && buf[1] === 0x21) {
    return 'shell script'
  }

  return null
}

function fix_permissions (bundle_path) {
  return glob(`${bundle_path}/**/*`, {nodir: true}).then((all_files) => {
    log(`Probing ${all_files.length} files for executables`)
    return all_files
  }).map((file) => {
    return read_chunk(file, 0, 8).then(sniff_format).then((format) => {
      if (!format) return
      let short_path = path.relative(bundle_path, file)
      log(`${short_path} looks like a ${format}, +x'ing it`)
      return fs.chmodAsync(file, 0o7770)
    })
  }, {concurrency: 4}).then(() => bundle_path)
}

export function configure (app_path) {
  return glob(`${app_path}/**/*.app/`).then((bundle_paths) => {
    return skip_junk(bundle_paths, app_path)
  }).then((bundle_paths) => {
    return Promise.all(bundle_paths.map(fix_permissions))
  }).then((executables) => {
    return {executables}
  })
}

