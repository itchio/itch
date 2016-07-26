
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
    let vendoredMagicPath = path.join(ibrew.binPath(), 'magic.mgc')
    if (await sf.exists(vendoredMagicPath)) {
      args = [
        ...args,
        // simply use name of our vendored magic file, i.e. relative to bin path
        // bin path is set as current directory below
        '-m', 'magic.mgc'
      ]
    }
  }
  args.push(filePath)

  let output

  console.log(`full file command: file ${args.join(' ')}`)

  let code = await spawn({
    command: 'file',
    args,
    opts: {
      cwd: ibrew.binPath()
    },
    onToken: (tok) => { output = tok },
    onErrToken: (tok) => { console.log(`file(1) stderr: ${tok}`) }
  })
  if (code !== 0) {
    throw new Error(`file(1) failed with exit code ${code}`)
  }

  return output.split(',').map((x) => x.trim())
}

export default file
