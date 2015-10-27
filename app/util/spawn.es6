
import Promise from 'bluebird'
import child_process from 'child_process'
import StreamSplitter from 'stream-splitter'

import noop from './noop'

function spawn (opts = {}) {
  let {command, args = [], split = '\n', ontoken = noop} = opts
  let child = child_process.spawn(command, args)

  let splitter = child.stdout.pipe(StreamSplitter(split))
  splitter.encoding = 'utf8'
  splitter.on('token', ontoken)

  return new Promise((resolve, reject, onCancel) => {
    child.on('close', resolve)
    child.on('error', reject)
  })
}

export default spawn
