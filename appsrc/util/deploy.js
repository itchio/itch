
import {difference} from 'underline'
import bluebird from 'bluebird'

import sf from './sf'
import noop from './noop'
import butler from './butler'

import ospath from 'path'

import mklog from './log'
const log = mklog('deploy')

import mv from '../promised/mv'

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
    }

    const {stagePath, destPath, onProgress = noop, onSingle = pnoop} = opts
    const stageFiles = await sf.glob('**', {cwd: stagePath, dot: true, nodir: true})

    if (stageFiles.length === 1) {
      let onlyFile = ospath.join(stagePath, stageFiles[0])
      let res = await onSingle(onlyFile)
      if (res && res.deployed) {
        // onSingle returning true means it's been handled upstraem
        return res
      }
    }

    await butler.mkdir(destPath)

    log(opts, `cleaning up dest path ${destPath}`)

    const receiptPath = ospath.join(destPath, '.itch', 'receipt.json')
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
      log(opts, 'Globbing for destfiles')
      destFiles = await sf.glob('**', {cwd: destPath, dot: true, nodir: true})
    }

    log(opts, `dest has ${destFiles.length} potential dinosaurs`)

    const dinosaurs = destFiles::difference(stageFiles)
    if (dinosaurs.length) {
      log(opts, `removing ${dinosaurs.length} dinosaurs in dest`)
      log(opts, `example dinosaurs: ${JSON.stringify(dinosaurs.slice(0, 10), null, 2)}`)

      await bluebird.map(dinosaurs, (rel) => {
        let dinosaur = ospath.join(destPath, rel)
        return butler.wipe(dinosaur)
      }, {concurrency: 4})
    } else {
      log(opts, 'no dinosaurs')
    }

    log(opts, 'moving files from stage to dest')
    const numStageFiles = stageFiles.length
    let n = 0
    await bluebird.map(stageFiles, async function (rel) {
      const before = ospath.join(stagePath, rel)
      const after = ospath.join(destPath, rel)
      await mv(before, after, {mkdirp: true})
      n++
      onProgress({percent: (n * 100 / numStageFiles)})
    }, {concurrency: 4})

    log(opts, 'everything copied, writing receipt')
    let cave = opts.cave || {}

    await sf.writeFile(receiptPath, JSON.stringify({
      cave,
      files: stageFiles
    }, null, 2))

    return {status: 'ok'}
  }
}

export default self
