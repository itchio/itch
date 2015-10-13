
import Promise from 'bluebird'
import spawn from 'win-spawn'
import app from 'app'
import path from 'path'
import request from 'request'
import mkdirp from 'mkdirp'

import os from './os'
let fs = Promise.promisifyAll(require('fs'))

let self = {
  run: function () {
    let third_party_path = path.join(app.getPath('userData'), 'bin')
    mkdirp.sync(third_party_path)
    console.log(`Adding ${third_party_path} to path`)
    process.env.PATH += `${path.delimiter}${third_party_path}`

    let handlers = {
      onstatus: () => null
    }

    let p = new Promise((resolve, reject) => {
      let download = () => {
        console.log('Could not launch 7za, attempting download')

        let prefix = 'https://cdn.rawgit.com/itchio/7za-binaries/v9.20/'
        let file

        switch (os.platform()) {
          case 'win32':
            file = '7za.exe'
            break
          case 'darwin':
            file = '7za'
            break
          default:
            reject('7-zip missing: 7za must be in $PATH\n(Try installing p7zip-full)')
            return
        }

        handlers.onstatus('Downloading 7-zip...', 'download')
        let url = `${prefix}${file}`
        console.log(`Downloading from ${url}`)

        let r = request.get({
          encoding: null, // binary
          url
        })

        r.on('error', (e) => {
          reject(`7-zip download failed with:\n${e}\nTry again later!`)
        })

        r.on('response', (response) => {
          if (!/^2/.test('' + response.statusCode)) {
            reject(`Could not download 7-zip, server error ${response.statusCode}\nTry again later!`)
          }
        })

        let target_path = path.join(third_party_path, file)
        let dst = fs.createWriteStream(target_path, { defaultEncoding: 'binary' })
        r.pipe(dst).on('close', (e) => {
          handlers.onstatus('7-zip downloaded.')
          console.log('Done downloading 7za!')
          switch (os.platform()) {
            case 'win32':
              // all good
              resolve()
              break
            default:
              resolve(fs.chmodAsync(target_path, 0o777))
              break
          }
        })
      }

      handlers.onstatus('Checking for 7-zip')

      try {
        let child = spawn('7za').on('error', (e) => {
          console.log(`while spawning 7za, got error: ${e}`)
          handlers.onstatus('7-zip not present!')
        })
        child.on('close', (code) => {
          if (code === 0) {
            handlers.onstatus('All good!')
            resolve()
          } else {
            download()
          }
        })
      } catch (e) {
        console.log(`Caught error ${e}, downloading`)
        download()
      }
    })

    p.status = (cb) => {
      handlers.onstatus = cb
      return p
    }

    return p
  }
}

export default self
