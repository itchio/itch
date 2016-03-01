
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const http = require('http')

let self = {
  create: (file_root, opts) => {
    let serve = serveStatic(file_root, opts)
    let server = http.createServer((req, res) => {
      let done = finalhandler(req, res)
      serve(req, res, done)
    })
    server.listen(0) // let node/os assign random port

    return server
  }
}

module.exports = self
