
const Transform = require('stream').Transform

class LFTransform extends Transform {
  constructor (opts) {
    super(opts)
  }

  _transform (chunk, encoding, done) {
    let data = chunk.toString()
    this.push(data.replace(/\r/g, ''))
    done()
  }
}

module.exports = LFTransform
