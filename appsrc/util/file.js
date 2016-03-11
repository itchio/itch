
import spawn from './spawn'
import os from './os'
import sf from './sf'
import ibrew from './ibrew'

import path from 'path'

const file = async (filePath) => {
  let args = [
    '--brief' // don't echo file name
  ]
  if (os.platform() === 'win32') {
    let vendored_magicPath = path.join(ibrew.binPath(), 'magic.mgc')
    if (await sf.exists(vendored_magicPath)) {
      args = args.concat([
        // use our vendored magic file
        '-m', vendored_magicPath
      ])
    }
  }
  args.push(filePath)

  let output

  let code = await spawn({
    command: 'file',
    args,
    onToken: (tok) => output = tok
  })
  if (code !== 0) {
    throw new Error(`file(1) failed with exit code ${code}`)
  }

  return output.split(',').map((x) => x.trim())
}

export default file
