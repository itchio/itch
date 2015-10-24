
import Promise from 'bluebird'
import child_process from 'child_process'
import StreamSplitter from 'stream-splitter'
import path from 'path'

import mkdirp from '../promised/mkdirp'

import noop from './noop'

let self = {
  /*
   * Uses https://github.com/itchio/butler to download a file
   */
  request: function (opts) {
    let {url, dest, onprogress = noop} = opts

    return mkdirp(path.dirname(dest))
      .then(() => {
        let args = ['dl', url, dest]
        let child = child_process.spawn('butler', args)
        let splitter = child.stdout.pipe(StreamSplitter('\n'))
        splitter.encoding = 'utf8'

        splitter.on('token', (token) => {
          let status = JSON.parse(token)
          if (status.Percent) {
            onprogress({percent: status.Percent})
          }
        })

        return new Promise((resolve, reject) => {
          child.on('close', resolve)
          child.on('error', reject)
        })
      })
  }
}

export default self
