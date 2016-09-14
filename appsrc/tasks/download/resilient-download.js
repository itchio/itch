
import ospath from 'path'
import urlParser from 'url'
import invariant from 'invariant'

import sf from '../../util/sf'
import butler from '../../util/butler'

import mklog from '../../util/log'
const log = mklog('download')

export default async function resilientDownload (out, opts) {
  let res
  let running = true

  while (running) {
    try {
      res = await tryDownload(out, opts)
      running = false
    } catch (err) {
      if (err === 'unexpected EOF') {
        // timed out - retry if we can refresh URL
        log(opts, 'download timed out')
        if (opts.refreshURL) {
          try {
            opts.url = await opts.refreshURL()
          } catch (rErr) {
            log(opts, `couldn't refresh download URL: ${rErr.message || rErr}`)
          }
        } else {
          log(opts, 'no way to refresh download URL')
          throw new Error('download timed out, retry later')
        }
      } else {
        // pass on error
        throw err
      }
    }
  }

  return res
}

async function tryDownload (out, opts) {
  const {url, destPath} = opts
  invariant(url, 'resilientDownload has url')

  const parsed = urlParser.parse(url)
  log(opts, `${parsed.hostname} -> ${destPath}`)

  const onProgress = (payload) => out.emit('progress', payload.percent / 100)

  log(opts, 'starting download!')
  try {
    await sf.mkdir(ospath.dirname(destPath))
    log(opts, 'butler download')
    await butler.dl({url, dest: destPath, onProgress, emitter: out, logger: opts.logger})
  } catch (err) {
    log(opts, `couldn't finish download: ${err.message || err}`)
    throw err
  }

  log(opts, 'finished')
}
