
import spawn from './spawn'
import os from './os'
import sf from './sf'
import ibrew from './ibrew'

import path from 'path'

const file = async (file_path) => {
  let args = [
    '--brief' // don't echo file name
  ]
  if (os.platform() === 'win32') {
    let vendored_magic_path = path.join(ibrew.bin_path(), 'magic.mgc')
    if (await sf.exists(vendored_magic_path)) {
      args = args.concat([
        // use our vendored magic file
        '-m', vendored_magic_path
      ])
    }
  }
  args.push(file_path)

  let output

  let code = await spawn({
    command: 'file',
    args,
    ontoken: (tok) => output = tok
  })
  if (code !== 0) {
    throw new Error(`file(1) failed with exit code ${code}`)
  }

  return output.split(',').map((x) => x.trim())
}

export default file
