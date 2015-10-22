
import Promise from 'bluebird'
import child_process from 'child_process'
import StreamSplitter from 'stream-splitter'
import path from 'path'

import mkdirp from '../promised/mkdirp'

import noop from './noop'

let self = {
  request: function (opts) {
    let {url, dest, onprogress = noop} = opts

    return mkdirp(path.dirname(dest))
      .then(() => {
        let child = child_process.spawn('wenger', ['dl', url, dest])
        let splitter = child.stdout.pipe(StreamSplitter('\n'))
        splitter.encoding = 'utf8'

        splitter.on('token', (token) => {
          let status = JSON.parse(token)
          let percent = status.Percent
          onprogress({percent})
        })

        return new Promise((resolve, reject) => {
          child.on('close', resolve)
          child.on('error', reject)
        })
      })
  }
}

export default self
