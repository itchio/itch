
let spawn = require('./spawn')
let os = require('./os')
let fs = require('../promised/fs')

let path = require('path')

let file = async (file_path) => {
  let ibrew = require('./ibrew')

  let args = [
    '--brief' // don't echo file name
  ]
  if (os.platform() === 'win32') {
    let vendored_magic_path = path.join(ibrew.bin_path(), 'magic.mgc')
    let has_vendored_magic = true

    try {
      await fs.lstatAsync(vendored_magic_path)
    } catch (e) {
      has_vendored_magic = false
    }

    if (has_vendored_magic) {
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
