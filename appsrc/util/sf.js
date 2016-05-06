
import Promise from 'bluebird'
import noop from './noop'

// let's patch all the things! Electron randomly decides to
// substitute 'fs' with their own version that considers '.asar'
// files to be read-only directories
// since itch can install applications that have .asar files, that
// won't do. we want sf to operate on actual files, so we need
// to operate some magic for various modules to use the original file system,
// not the Electron-patched one.

let fsName = 'original-fs'
if (!process.versions.electron) {
  // when running tests, we don't have access to original-fs
  fsName = 'fs'
}

import proxyquire from 'proxyquire'

let fs = Object.assign({}, require(fsName), {
  '@global': true, /* Work with transitive imports */
  '@noCallThru': true, /* Don't even require/hit electron fs */
  disableGlob: true /* Don't ever use globs with rimraf */
})

// graceful-fs fixes a few things https://www.npmjs.com/package/graceful-fs
// notably, EMFILE, EPERM, etc.
const gracefulFs = Object.assign({}, proxyquire('graceful-fs', {fs}), {
  '@global': true, /* Work with transitive imports */
  '@noCallThru': true /* Don't even require/hit electron fs */
})

// when proxyquired modules load, they'll require what we give
// them instead of
const stubs = {
  'fs': gracefulFs,
  'graceful-fs': gracefulFs
}

const debugLevel = ~~process.env.INCENTIVE_MET || -1
const debug = (level, parts) => {
  if (debugLevel < level) {
    return
  }

  console.log(`[sf] ${parts.join(' ')}`)
}

fs = gracefulFs

// adds 'xxxAsync' variants of all fs functions, which we'll use
Promise.promisifyAll(fs)

// single function, callback-based, can't specify fs
const glob = Promise.promisify(proxyquire('glob', stubs))

// single function, callback-based, can't specify fs
const mkdirp = Promise.promisify(proxyquire('mkdirp', stubs))

// single function, callback-based, doesn't accept fs
const readChunk = Promise.promisify(proxyquire('read-chunk', stubs))

// other deps
import path from 'path'

// global ignore patterns
const ignore = [
  // on OSX, trashes exist on dmg volumes but cannot be scandir'd for some reason
  '**/.Trashes/**'
]

const concurrency = 8

/*
 * sf = backward fs, because fs itself is quite backwards
 */
const self = {
  /**
   * Returns true if file exists, false if ENOENT, throws if other error
   */
  exists: (file) => {
    pre: { // eslint-disable-line
      typeof file === 'string'
    }

    return new Promise((resolve, reject) => {
      const callback = (err) => {
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
  readFile: async (file) => {
    pre: { // eslint-disable-line
      typeof file === 'string'
    }

    return await fs.readFileAsync(file, {encoding: 'utf8'})
  },

  appendFile: async (file, contents, options) => {
    return await fs.appendFileAsync(file, contents, options)
  },

  /**
   * Writes an utf-8 string to 'file'. Creates any directory needed.
   */
  writeFile: async (file, contents) => {
    pre: { // eslint-disable-line
      typeof file === 'string'
      typeof contents === 'string'
    }

    await self.mkdir(path.dirname(file))
    return await fs.writeFileAsync(file, contents)
  },

  /**
   * Turns a stream into a promise, resolves when
   * 'close' or 'end' is emitted, rejects when 'error' is
   */
  promised: async (stream) => {
    pre: { // eslint-disable-line
      typeof stream === 'object'
    }

    const p = new Promise((resolve, reject) => {
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
    pre: { // eslint-disable-line
      typeof dir === 'string'
    }

    return await mkdirp(dir)
  },

  /**
   * Rename oldPath into newPath, throws if it can't
   */
  rename: async (oldPath, newPath) => {
    pre: { // eslint-disable-line
      typeof oldPath === 'string'
      typeof newPath === 'string'
    }

    return await fs.renameAsync(oldPath, newPath)
  },

  /**
   * Burn to the ground an entire directory and everything in it
   * Also works on file, don't bother with unlink.
   */
  wipe: async (shelter) => {
    pre: { // eslint-disable-line
      typeof shelter === 'string'
    }

    debug(1, ['wipe', shelter])

    let stats
    try {
      stats = await self.lstat(shelter)
    } catch (err) {
      if (err.code === 'ENOENT') {
        return
      }
      throw err
    }

    if (stats.isDirectory()) {
      const fileOrDirs = await self.glob('**', {cwd: shelter, dot: true, ignore})
      const dirs = []
      const files = []

      for (const fad of fileOrDirs) {
        const fullFad = path.join(shelter, fad)

        let stats
        try {
          stats = await self.lstat(fullFad)
        } catch (err) {
          if (err.code === 'ENOENT') {
            // good!
            continue
          } else {
            throw err
          }
        }

        if (stats.isDirectory()) {
          dirs.push(fad)
        } else {
          files.push(fad)
        }
      }

      const unlink = async (file) => {
        const fullFile = path.join(shelter, file)
        await self.unlink(fullFile)
      }
      await Promise.resolve(files).map(unlink, {concurrency})

      // remove deeper dirs first
      dirs.sort((a, b) => (b.length - a.length))

      // needs to be done in order
      for (const dir of dirs) {
        const fullDir = path.join(shelter, dir)

        debug(2, ['rmdir', fullDir])
        await self.rmdir(fullDir)
      }

      debug(1, ['rmdir', shelter])
      await self.rmdir(shelter)
      debug(1, ['wipe', 'shelter', `done (removed ${files.length} files & ${dirs.length} directories)`])
    } else {
      debug(1, ['unlink', shelter])
      await self.unlink(shelter)
    }
  },

  /**
   * If this runs successfully, 'dst' will mirror the contents of 'src'
   * (Does not remove files that aren't in src)
   */
  ditto: async (src, dst, opts) => {
    pre: { // eslint-disable-line
      typeof src === 'string'
      typeof dst === 'string'
      typeof opts === 'object' || opts === undefined
    }

    debug(2, ['ditto', src, dst])

    if (typeof opts === 'undefined') {
      opts = {}
    }
    const onProgress = opts.onProgress || noop
    const alwaysFalse = () => false
    const shouldSkip = opts.shouldSkip || alwaysFalse
    const operation = opts.operation || 'copy'
    const move = (operation === 'move')

    const _copy = async (srcFile, dstFile, stats) => {
      if (stats.isSymbolicLink()) {
        const linkTarget = await self.readlink(srcFile)

        debug(2, ['symlink', linkTarget, dstFile])
        await self.wipe(dstFile)
        await self.symlink(linkTarget, dstFile)
      } else {
        if (move) {
          debug(2, ['rename', srcFile, dstFile])
          await self.rename(srcFile, dstFile)
        } else {
          // we still need to be able to read/write the file
          const mode = stats.mode & 0o777 | 0o666
          debug(2, ['cp', mode.toString(8), srcFile, dstFile])
          const ws = self.createWriteStream(dstFile, {
            flags: 'w',
            /* anything is binary if you try hard enough */
            defaultEncoding: 'binary',
            mode
          })
          const rs = self.createReadStream(srcFile, {encoding: 'binary'})
          const cp = self.promised(ws)
          rs.pipe(ws)
          await cp
          rs.close()
        }
      }
    }

    // if we're not a directory, no need to recurse
    const stats = await self.lstat(src)
    if (!stats.isDirectory()) {
      await _copy(src, dst, stats)
      return
    }

    // unfortunately, glob considers symlinks like directories :(
    // we can't use '**/*' as this will return paths *inside* symlinked dirs
    const filesAndDirs = await self.glob('**', {cwd: src, dot: true, ignore})

    const files = []
    const dirs = []

    for (const fad of filesAndDirs) {
      const fullFad = path.join(src, fad)
      const stats = await self.lstat(fullFad)
      if (stats.isDirectory()) {
        dirs.push(fad)
      } else {
        files.push([fad, stats])
      }
    }

    // create shallow dirs first
    dirs.sort((a, b) => (a.length - b.length))

    const mkdir = async (dir) => {
      const fullDir = path.join(dst, dir)
      debug(2, ['mkdir', fullDir])
      await self.mkdir(fullDir)
    }

    // have to mkdir sequentially
    for (const dir of dirs) {
      await mkdir(dir)
    }

    let numDone = 0

    const copy = async (arr) => {
      const file = arr[0]
      const stats = arr[1]

      if (shouldSkip(file)) {
        debug(2, ['skipping', file])
        return
      }

      const srcFile = path.join(src, file)
      const dstFile = path.join(dst, file)
      await _copy(srcFile, dstFile, stats)

      numDone += 1
      const percent = numDone * 100 / files.length
      onProgress({percent, done: numDone, total: files.length})
    }

    // can copy in parallel, all directories already exist
    await Promise.resolve(files).map(copy, {concurrency})

    debug(1, ['ditto', src, dst, `done (copied ${files.length} files & ${dirs.length} directories)`])
  },

  /**
   * Promised version of isaacs' little globber
   * https://www.npmjs.com/package/glob
   */
  glob,

  /**
   * Promised version of readChunk
   * https://www.npmjs.com/package/read-chunk
   */
  readChunk,

  fsName,
  fs
}

function makeBindings () {
  const mirrored = ['createReadStream', 'createWriteStream']
  for (const m of mirrored) {
    self[m] = fs[m].bind(fs)
  }

  const mirorredAsync = ['chmod', 'stat', 'lstat', 'readlink', 'symlink', 'rmdir', 'unlink']
  for (const m of mirorredAsync) {
    self[m] = fs[m + 'Async'].bind(fs)
  }
}
makeBindings()

export default self
