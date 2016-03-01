
const spawn = require('./spawn')
const os = require('./os')
const sf = require('./sf')

const path = require('path')

let file = async (file_path) => {
  const ibrew = require('./ibrew')

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

module.exports = file
