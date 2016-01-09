
let Promise = require('bluebird')
let noop = require('./noop')

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
  disableGlob: true /* Don't ever use globs with rimraf */
})

// adds 'xxxAsync' variants of all fs functions, which we'll use
Promise.promisifyAll(fs)

// graceful-fs fixes a few things https://www.npmjs.com/package/graceful-fs
// notably, EMFILE, EPERM, etc.
let graceful_fs = Object.assign({}, proxyquire('graceful-fs', {fs}), {
  '@global': true, /* Work with transitive imports */
  '@noCallThru': true /* Don't even require/hit electron fs */
})

// when proxyquired modules load, they'll require what we give
// them instead of
let stubs = {
  'fs': graceful_fs,
  'graceful-fs': graceful_fs
}

let debug = () => null

if (process.env.INCENTIVE_MET) {
  debug = (msg) => console.log(`[sf] ${msg}`)
}

fs = graceful_fs

// single function, callback-based, can't specify fs
let glob = Promise.promisify(proxyquire('glob', stubs))

// single function, callback-based, can't specify fs
let mkdirp = Promise.promisify(proxyquire('mkdirp', stubs))

// single function, callback-based, doesn't accept fs
let read_chunk = Promise.promisify(proxyquire('read-chunk', stubs))

// other deps
let path = require('path')

// graceful-fs should keep us from EMFILE
let concurrency = 8

// global ignore patterns
let ignore = [
  // on OSX, trashes exist on dmg volumes but cannot be scandir'd for some reason
  '**/.Trashes/**'
]

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
   */
  wipe: async (file_or_dir) => {
    debug(`wipe ${file_or_dir}`)

    let stats

    try {
      stats = await self.lstat(file_or_dir)
    } catch (err) {
      if (err.code === 'ENOENT') {
        debug(`already wiped: ${file_or_dir}`)
        return
      }
      throw err
    }

    if (stats.isDirectory()) {
      let files = await self.glob('**/*', {nodir: true, cwd: file_or_dir, dot: true, ignore})

      for (let file of files) {
        let full_file = path.join(file_or_dir, file)
        debug(`rm ${full_file}`)
        await self.unlink(full_file)
      }

      let dirs = await self.glob('**/*/', {cwd: file_or_dir, dot: true, ignore})
      // remove deeper dirs first
      dirs.sort((a, b) => (b.length - a.length))

      for (let dir of dirs) {
        let full_dir = path.join(file_or_dir, dir)
        debug(`rmdir ${full_dir}`)
        await self.rmdir(full_dir)
      }
    } else {
      debug(`rm ${file_or_dir}`)
      await self.unlink(file_or_dir)
    }
  },

  /**
   * If this runs successfully, 'dst' will mirror the contents of 'src'
   * (Does not remove files that aren't in src)
   */
  ditto: async (src, dst, opts) => {
    debug(`ditto ${src} ${dst}`)

    let _copy = async (src_file, dst_file) => {
      let stats = await self.lstat(src_file)

      if (stats.isSymbolicLink()) {
        let link_target = await self.readlink(src_file)

        debug(`ln -s ${link_target} ${dst_file}`)
        await self.wipe(dst_file)
        await self.symlink(link_target, dst_file)
      } else {
        let ws = self.createWriteStream(dst_file, {
          flags: 'w',
          defaultEncoding: 'binary',
          mode: stats.mode
        })
        let rs = self.createReadStream(src_file, { encoding: 'binary' })
        let cp = self.promised(rs)
        rs.pipe(ws)
        debug(`cp ${src_file} ${dst_file}`)
        await cp
      }
    }

    if (typeof opts === 'undefined') {
      opts = {}
    }
    let onprogress = opts.onprogress || noop
    let always_false = () => false
    let should_skip = opts.should_skip || always_false

    let stats = await self.lstat(src)
    if (!stats.isDirectory()) {
      await _copy(src, dst)
      return
    }

    let mkdir = async (dir) => {
      debug(`mkdir ${dir}`)
      await self.mkdir(path.join(dst, dir))
    }
    let dirs = await self.glob('**/*/', {cwd: src, dot: true, ignore})

    // have to mkdir sequentially
    await Promise.resolve(dirs).each(mkdir)

    let files = await self.glob('**/*', {cwd: src, dot: true, nodir: true, ignore})
    let num_done = 0

    let copy = async (file) => {
      let src_file = path.join(src, file)
      if (should_skip(src_file)) {
        debug(`skipping ${src_file}`)
        return
      }

      let dst_file = path.join(dst, file)
      await _copy(src_file, dst_file)

      num_done += 1
      let percent = num_done * 100 / files.length
      onprogress({percent, done: num_done, total: files.length})
    }

    // can copy in parallel, all directories already exist
    await Promise.resolve(files).map(copy, {concurrency})
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

  fs_name
}

let mirrored = ['createReadStream', 'createWriteStream']
for (let m of mirrored) {
  self[m] = fs[m].bind(fs)
}

let mirorred_async = ['chmod', 'stat', 'lstat', 'readlink', 'symlink', 'rmdir', 'unlink']
for (let m of mirorred_async) {
  self[m] = fs[m + 'Async'].bind(fs)
}

module.exports = self
