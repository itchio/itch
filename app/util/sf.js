
let Promise = require('bluebird')

// let's patch all the things! Electron randomly decides to
// substitute 'fs' with their own version that considers '.asar'
// files to be read-only directories
// since itch can install applications that have .asar files, that
// won't do. we want sf to operate on actual files, so we need
// to operate some magic for various modules to use the original file system,
// not the Electron-patched one.

let fs_name = 'original-fs'
if (!process.versions.electron) {
  // when running tests, we don't have access to original-fs
  fs_name = 'fs'
}

let proxyquire = require('proxyquire')
let fs = Object.assign({}, require(fs_name), {
  '@global': true, /* Work with transitive imports */
  '@noCallThru': true, /* Don't even require/hit electron fs */
  disableGlob: true /* Don't ever use globs with rimrafj */
})

// graceful-fs fixes a few things https://www.npmjs.com/package/graceful-fs
// notably, EMFILE, EPERM, etc.
require('graceful-fs').gracefulify(fs)

// when proxyquired modules load, they'll require what we give
// them instead of
let stubs = {
  'fs': fs,
  /* required by fstream */
  'graceful-fs': fs
}

// adds 'xxxAsync' variants of all fs functions, which we'll use
Promise.promisifyAll(fs)

// single function, callback-based, can't specify fs
let glob = Promise.promisify(proxyquire('glob', stubs))

// single function, callback-based, can't specify fs
let mkdirp = Promise.promisify(proxyquire('mkdirp', stubs))

// single function, callback-based, accepts fs as second argument
let rimraf = Promise.promisify(require('rimraf'))

// single function, callback-based, doesn't accept fs
let read_chunk = Promise.promisify(proxyquire('read-chunk', stubs))

// family of functions, callback-based, can't specify fs
let fstream = proxyquire('fstream', stubs)

// other deps
let path = require('path')

/*
 * sf = backward fs, because fs itself is quite backwards
 */
let self = {
  /**
   * Returns true if file exists, false if ENOENT, throws if other error
   */
  exists: (file) => {
    return new Promise((resolve, reject) => {
      let callback = (err) => {
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(false)
          } else {
            reject(err)
          }
        } else {
          resolve(true)
        }
      }

      fs.access(file, fs.R_OK, callback)
    })
  },

  /**
   * Return utf-8 file contents as string
   */
  read_file: async (file) => {
    return await fs.readFileAsync(file, {encoding: 'utf8'})
  },

  /**
   * Writes an utf-8 string to `file`. Creates any directory needed.
   */
  write_file: async (file, contents) => {
    await self.mkdir(path.dirname(file))
    return await fs.writeFileAsync(file, contents)
  },

  /**
   * Creates an fstream reader
   * Doc: there is no doc
   */
  Reader: fstream.Reader.bind(fstream),

  /**
   * Creates an fstream writer
   * Doc: there is no doc
   */
  Writer: fstream.Writer.bind(fstream),

  /**
   * Turns a stream into a promise, resolves when
   * 'close' or 'end' is emitted, rejects when 'error' is
   */
  promised: async (stream) => {
    let p = new Promise((resolve, reject) => {
      stream.on('close', resolve)
      stream.on('end', resolve)
      stream.on('error', reject)
    })
    return await p
  },

  /**
   * Create each supplied directory including any necessary parent directories that
   * don't yet exist.
   *
   * If the directory already exists, do nothing.
   * Uses mkdirp: https://www.npmjs.com/package/mkdirp
   */
  mkdir: async (dir) => {
    return await mkdirp(dir)
  },

  /**
   * Burn to the ground an entire directory and everything in it
   * Also works on file, don't bother with unlink.
   * Uses rimraf: https://www.npmjs.com/package/rimraf
   */
  wipe: async (file_or_dir) => {
    return await rimraf(file_or_dir, fs)
  },

  /**
   * If this runs successfully, 'dst' will mirror the contents of 'src'
   * (Does not remove files that aren't in src)
   */
  ditto: async (src, dst) => {
    let rsync = fstream.Reader(src).pipe(fstream.Writer(dst))
    return await self.promised(rsync)
  },

  /**
   * Promised version of isaacs' little globber
   * https://www.npmjs.com/package/glob
   */
  glob,

  /**
   * Promised version of read_chunk
   * https://www.npmjs.com/package/read-chunk
   */
  read_chunk,

  chmod: fs.chmodAsync.bind(fs),
  lstat: fs.lstatAsync.bind(fs),
  stat: fs.statAsync.bind(fs)
}

module.exports = self
