
import noop from '../../util/noop'
import spawn from '../../util/spawn'
import butler from '../../util/butler'
import deploy from '../../util/deploy'

import archive from './archive'

import path from 'path'

import mklog from '../../util/log'
const log = mklog('installers/dmg')

const HFS_RE = /(\S*)\s*(Apple_HFS)?\s+(.*)\s*$/

let self = {
  install: async function (out, opts) {
    let archivePath = opts.archivePath
    let onProgress = opts.onProgress || noop

    log(opts, `Preparing installation of '${archivePath}'`)
    onProgress({percent: -1})

    let cdrPath = path.resolve(archivePath + '.cdr')

    let infoEntries = []
    let code = await spawn({
      command: 'hdiutil',
      args: ['info'],
      split: '================================================',
      onToken: (tok) => {
        infoEntries.push(tok.split('\n'))
      }
    })
    if (code !== 0) {
      throw new Error(`hdiutil failed with code ${code}`)
    }

    for (const entry of infoEntries) {
      let imagePath
      for (const line of entry) {
        let matches = /^image-path\s*:\s*(.*)\s*$/.exec(line)
        if (matches) {
          imagePath = matches[1]
          break
        }
      }

      log(opts, `Found image ${imagePath}`)
      if (imagePath && imagePath === cdrPath) {
        let mountpoint

        for (let line of entry) {
          if (/Apple_partition_scheme\s*$/.test(line)) {
            mountpoint = line.split(/\s/)[0]
            break
          }
        }

        if (!mountpoint) {
          log(opts, `Could not detach ${cdrPath}`)
          continue
        }

        log(opts, `Trying to detach ${cdrPath}...`)
        code = await spawn({
          command: 'hdiutil',
          args: [ 'detach', '-force', mountpoint ]
        })
      }
    }

    log(opts, `Done looking for previously mounted images`)
    log(opts, `Trying to unlink ${cdrPath}`)

    try {
      await butler.wipe(cdrPath)
    } catch (e) {
      log(opts, `Couldn't unlink ${cdrPath}: ${e}`)
    }

    log(opts, `Converting archive '${archivePath}' to CDR with hdiutil`)

    code = await spawn({
      command: 'hdiutil',
      args: [
        'convert',
        archivePath,
        '-format', 'UDTO',
        '-o', cdrPath
      ]
    })
    if (code !== 0) {
      throw new Error(`Failed to convert dmg image, with code ${code}`)
    }

    log(opts, `Attaching cdr file ${cdrPath}`)

    let device
    let mountpoint

    code = await spawn({
      command: 'hdiutil',
      args: [
        'attach',
        '-nobrowse', // don't show up in Finder's device list
        '-noautoopen', // don't open Finder window with newly-mounted part
        '-noverify', // no integrity check (we do those ourselves)
        cdrPath
      ],
      onToken: (tok) => {
        log(opts, `hdiutil attach: ${tok}`)
        let hfsMatches = HFS_RE.exec(tok)
        if (hfsMatches) {
          device = hfsMatches[1].trim()
          mountpoint = hfsMatches[3].trim()
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

    let deployOpts = Object.assign({}, opts, {
      stagePath: mountpoint
    })
    await deploy.deploy(deployOpts)

    let cleanup = async () => {
      log(opts, `Detaching cdr file ${cdrPath}`)
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

      log(opts, `Removing cdr file ${cdrPath}`)
      await butler.wipe(cdrPath)
    }

    log(opts, `Launching cleanup asynchronously...`)
    cleanup()
  },

  uninstall: async function (out, opts) {
    log(opts, `Relying on archive's uninstall routine`)
    await archive.uninstall(out, opts)
  }
}

export default self
