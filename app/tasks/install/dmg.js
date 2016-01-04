'use strict'

let noop = require('../../util/noop')
let spawn = require('../../util/spawn')

let glob = require('../../promised/glob')
let mkdirp = require('../../promised/mkdirp')
let fs = require('../../promised/fs')

let fstream = require('fstream')

let archive = require('./archive')
let path = require('path')

let log = require('../../util/log')('installers/dmg')

let HFS_RE = /(.*)\s+Apple_HFS\s+(.*)\s*$/

let self = {
  should_skip: function (f) {
    // Don't copy OSX (literal) trash
    if (/\.Trashes$/.test(f)) return true
    // Don't copy Applications symlink
    if (/^Applications$/.test(f)) return true
    return false
  },

  install: async function (opts) {
    console.log(`in dmg, do we have a logger?, ${!!opts.logger}`)

    let archive_path = opts.archive_path
    let dest_path = opts.dest_path
    let onprogress = opts.onprogress || noop

    log(opts, `Preparing installation of '${archive_path}'`)

    let cdr_path = path.resolve(archive_path + '.cdr')

    let info_entries = []
    let code = await spawn({
      command: 'hdiutil',
      args: ['info'],
      split: '================================================',
      ontoken: (tok) => {
        info_entries.push(tok.split('\n'))
      }
    })
    if (code !== 0) {
      throw new Error(`hdiutil failed with code ${code}`)
    }

    for (let entry of info_entries) {
      let image_path
      for (let line of entry) {
        let matches = /^image-path\s*:\s*(.*)\s*$/.exec(line)
        if (matches) {
          image_path = matches[1]
          break
        }
      }

      log(opts, `Found image ${image_path}`)
      if (image_path && image_path === cdr_path) {
        let mountpoint

        for (let line of entry) {
          if (/Apple_partition_scheme\s*$/.test(line)) {
            mountpoint = line.split(/\s/)[0]
            break
          }
        }

        if (!mountpoint) {
          log(opts, `Could not detach ${cdr_path}`)
          continue
        }

        log(opts, `Trying to detach ${cdr_path}...`)
        code = await spawn({
          command: 'hdiutil',
          args: [ 'detach', '-force', mountpoint ]
        })
      }
    }

    log(opts, `Done looking for previously mounted images`)
    log(opts, `Trying to unlink ${cdr_path}`)

    try {
      await fs.unlinkAsync(cdr_path)
    } catch (e) {
      log(opts, `Couldn't unlink ${cdr_path}: ${e}`)
    }

    onprogress({percent: 5})

    log(opts, `Converting archive '${archive_path}' to CDR with hdiutil`)

    code = await spawn({
      command: 'hdiutil',
      args: [
        'convert',
        archive_path,
        '-format', 'UDTO',
        '-o', cdr_path
      ]
    })
    if (code !== 0) {
      throw new Error(`Failed to convert dmg image, with code ${code}`)
    }

    onprogress({percent: 30})

    log(opts, `Attaching cdr file ${cdr_path}`)

    let device
    let mountpoint

    code = await spawn({
      command: 'hdiutil',
      args: [
        'attach',
        '-nobrowse', // don't show up in Finder's device list
        '-noautoopen', // don't open Finder window with newly-mounted part
        '-noverify', // no integrity check (we do those ourselves)
        cdr_path
      ],
      ontoken: (tok) => {
        log(opts, `hdiutil attach: ${tok}`)
        let hfs_matches = HFS_RE.exec(tok)
        if (hfs_matches) {
          device = hfs_matches[1].trim()
          mountpoint = hfs_matches[2].trim()
          log(opts, `found dev / mountpoint: '${device}' '${mountpoint}'`)
        }
      }
    })
    if (code !== 0) {
      throw new Error(`Failed to mount image, with code ${code}`)
    }

    if (!mountpoint) {
      throw new Error('Failed to mount image (no mountpoint)')
    }

    onprogress({percent: 33})

    log(opts, `Creating target directory ${dest_path}`)
    await mkdirp(dest_path)

    log(opts, `Copying all files from ${mountpoint} to ${dest_path}`)
    let files = await glob(`**/*`, {cwd: mountpoint, nodir: true})
    let num_files = files.length
    let copied_files = 0

    for (let f of files) {
      if (!self.should_skip(f)) {
        let src = path.join(mountpoint, f)
        let dst = path.join(dest_path, f)

        let cp = fstream.Reader(src)
        let cpp = new Promise((resolve, reject) => {
          cp.on('end', resolve)
          cp.on('error', reject)
        })
        cp.pipe(fstream.Writer(dst))

        await cpp
      }

      copied_files += 1
      let percent = (0.33 + 0.66 * (copied_files / num_files)) * 100
      onprogress({percent})
    }

    log(opts, `Detaching cdr file ${cdr_path}`)
    code = await spawn({
      command: 'hdiutil',
      args: [
        'detach',
        '-force', // ignore opened files, etc.
        device
      ]
    })
    if (code !== 0) {
      throw new Error(`Failed to mount image, with code ${code}`)
    }

    log(opts, `Removing cdr file ${cdr_path}`)
    await fs.unlinkAsync(cdr_path)

    onprogress({percent: 100})
  },

  uninstall: async function (opts) {
    log(opts, `Relying on archive's uninstall routine`)
    await archive.uninstall(opts)
  }
}

module.exports = self
