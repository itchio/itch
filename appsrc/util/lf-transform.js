
const Transform = require('stream').Transform

class LFTransform extends Transform {
  _transform (chunk, encoding, done) {
    let data = chunk.toString()
    this.push(data.replace(/\r/g, ''))
    done()
  }
}

export default LFTransform
