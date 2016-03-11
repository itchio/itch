
import {difference} from 'underline'
import bluebird from 'bluebird'

import sf from './sf'
import noop from './noop'
import butler from './butler'

import path from 'path'

import mklog from './log'
const log = mklog('deploy')

let pnoop = async () => null

let self = {
  /**
   * Given a stagePath, and a destPath
   *   - Figures out which files disappeared from stage since last deploying to dest
   *   - Removes those
   *   - Copy all the new files from stage to dest, overwriting
   *   - Write receipt with list of files present in stage at deploy time
   *     (that receipt will be used on next deploy)
   */
  deploy: async (opts) => {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.stagePath === 'string'
      typeof opts.destPath === 'string'
      typeof opts.emitter === 'object'
    }

    const {stagePath, destPath, emitter, onProgress = noop, onSingle = pnoop} = opts
    const stageFiles = await sf.glob('**', {cwd: stagePath})

    if (stageFiles.length === 1) {
      let onlyFile = path.join(stagePath, stageFiles[0])
      let res = await onSingle(onlyFile)
      if (res && res.deployed) {
        // onSingle returning true means it's been handled upstraem
        return res
      }
    }

    await butler.mkdir(destPath)

    log(opts, `cleaning up dest path ${destPath}`)

    const receiptPath = path.join(destPath, '.itch', 'receipt.json')
    let destFiles = []

    try {
      let receiptContents = await sf.readFile(receiptPath)
      let receipt = JSON.parse(receiptContents)
      destFiles = receipt.files || []
      log(opts, `Got receipt for an existing ${destFiles.length}-files install.`)
    } catch (err) {
      log(opts, `Could not read receipt: ${err.message}`)
    }
    if (!destFiles.length) {
      log(opts, `Globbing for destfiles`)
      destFiles = await sf.glob('**', {cwd: destPath})
    }

    log(opts, `dest has ${destFiles.length} potential dinosaurs`)

    const dinosaurs = destFiles::difference(stageFiles)
    if (dinosaurs.length) {
      log(opts, `removing ${dinosaurs.length} dinosaurs in dest`)
      log(opts, `example dinosaurs: ${JSON.stringify(dinosaurs.slice(0, 10), null, 2)}`)

      await bluebird.map(dinosaurs, (rel) => {
        let dinosaur = path.join(destPath, rel)
        return butler.wipe(dinosaur)
      }, {concurrency: 4})
    } else {
      log(opts, `no dinosaurs`)
    }

    log(opts, `copying stage to dest`)
    await butler.ditto(stagePath, destPath, {
      onProgress,
      emitter: emitter
    })

    log(opts, `everything copied, writing receipt`)
    let cave = opts.cave || {}

    await sf.writeFile(receiptPath, JSON.stringify({
      cave,
      files: stageFiles
    }, null, 2))

    return {status: 'ok'}
  }
}

export default self
