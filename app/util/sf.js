
let Promise = require('bluebird')
let fstream = require('fstream-electron')
let path = require('path')

let original_fs = require('original-fs')
let fs = require('../promised/fs')
let rimraf = require('../promised/rimraf')
let mkdirp = require('../promised/mkdirp')
let glob = require('../promised/glob')

let our_fs = Object.assign({}, original_fs, {disableGlob: true})

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
    await self.mkdirp(path.dirname(file))
    return await fs.writeFileAsync(file, contents)
  },

  /**
   * Create each supplied directory including any necessary parent directories that
   * don't yet exist.
   *
   * If the directory already exists, do nothing.
   */
  mkdir: async (dir) => {
    return await mkdirp(dir)
  },

  /**
   * Burn to the ground an entire directory and everything in it
   */
  wipe: async (file_or_dir) => {
    return await rimraf(file_or_dir, our_fs)
  },

  /**
   * If this runs successfully, 'dst' will mirror the contents of 'src'
   *
   * Does not remove files that aren't in src
   */
  ditto: async (src, dst) => {
    let cp = fstream.Reader(src)
    let cpp = new Promise((resolve, reject) => {
      cp.on('end', resolve)
      cp.on('error', reject)
    })
    cp.pipe(fstream.Writer(dst))
    return await cpp
  },

  /**
   * Promised version of isaacs' little globber
   */
  glob
}

module.exports = self
