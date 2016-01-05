
let spawn = require('./spawn')
let ibrew = require('./ibrew')
let os = require('./os')

let path = require('path')

let file = async (file_path) => {
  let args = [
    '--brief' // don't echo file name
  ]
  if (os.platform() === 'win32') {
    args = args.concat([
      // we ship our own magic file
      '-m', path.join(ibrew.bin_path, 'magic.mgc')
    ])
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
