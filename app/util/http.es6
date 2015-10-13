
import Promise from 'bluebird'

import app from 'app'
import assign from 'object-assign'

import request from 'request'
import progress from 'request-progress'

import mkdirp from 'mkdirp'
import path from 'path'
import fs from 'fs'

function to_file (opts) {
  return new Promise((resolve, reject) => {
    let {url, file, flags, headers, onprogress} = opts
    headers = assign({}, headers, {
      'User-Agent': `itchio-app/${app.getVersion()}`
    })

    mkdirp.sync(path.dirname(file))

    let r = progress(request.get({ encoding: null, url, headers }))
    r.on('progress', onprogress)

    r.on('error', (err) => {
      reject(err)
    })

    r.pipe(fs.createWriteStream(file, {
      flags,
      defaultEncoding: 'binary'
    })).on('close', () => {
      resolve()
    })
  })
}

export default { to_file }
