
import {difference} from 'underline'
import bluebird from 'bluebird'

let sf = require('./sf')
let noop = require('./noop')
let butler = require('./butler')

let path = require('path')

let log = require('./log')('deploy')

let pnoop = async () => null

let self = {
  /**
   * Given a stage_path, and a dest_path
   *   - Figures out which files disappeared from stage since last deploying to dest
   *   - Removes those
   *   - Copy all the new files from stage to dest, overwriting
   *   - Write receipt with list of files present in stage at deploy time
   *     (that receipt will be used on next deploy)
   */
  deploy: async (opts) => {
    pre: { // eslint-disable-line
      typeof opts === 'object'
      typeof opts.stage_path === 'string'
      typeof opts.dest_path === 'string'
      typeof opts.emitter === 'object'
    }

    let {stage_path, dest_path, emitter} = opts
    let onprogress = opts.onprogress || noop
    let onsingle = opts.onsingle || pnoop

    let stage_files = await sf.glob('**', {cwd: stage_path})

    if (stage_files.length === 1) {
      let only_file = path.join(stage_path, stage_files[0])
      let res = await onsingle(only_file)
      if (res && res.deployed) {
        // onsingle returning true means it's been handled upstraem
        return res
      }
    }

    await butler.mkdir(dest_path)

    log(opts, `cleaning up dest path ${dest_path}`)

    let receipt_path = path.join(dest_path, '.itch', 'receipt.json')
    let dest_files = []

    try {
      let receipt_contents = await sf.read_file(receipt_path)
      let receipt = JSON.parse(receipt_contents)
      dest_files = receipt.files || []
      log(opts, `Got receipt for an existing ${dest_files.length}-files install.`)
    } catch (err) {
      log(opts, `Could not read receipt: ${err.message}`)
    }
    if (!dest_files.length) {
      log(opts, `Globbing for destfiles`)
      dest_files = await sf.glob('**', {cwd: dest_path})
    }

    log(opts, `dest has ${dest_files.length} potential dinosaurs`)

    let dinosaurs = dest_files::difference(stage_files)
    if (dinosaurs.length) {
      log(opts, `removing ${dinosaurs.length} dinosaurs in dest`)
      log(opts, `example dinosaurs: ${JSON.stringify(dinosaurs.slice(0, 10), null, 2)}`)

      await bluebird.map(dinosaurs, (rel) => {
        let dinosaur = path.join(dest_path, rel)
        return butler.wipe(dinosaur)
      }, {concurrency: 4})
    } else {
      log(opts, `no dinosaurs`)
    }

    log(opts, `copying stage to dest`)
    await butler.ditto(stage_path, dest_path, {
      onprogress,
      emitter: emitter
    })

    log(opts, `everything copied, writing receipt`)
    let cave = opts.cave || {}

    await sf.write_file(receipt_path, JSON.stringify({
      cave,
      num_files: stage_files.length,
      files: stage_files
    }, null, 2))

    return {status: 'ok'}
  }
}

module.exports = self
