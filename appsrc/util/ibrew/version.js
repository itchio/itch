
/* A very small, very bad implementation of versioning */

let self = {
  normalize: (v) => {
    if (!v) return v
    return v.replace(/^v/, '')
  },

  equal: (a, b) => {
    return self.normalize(a) === self.normalize(b)
  }
}

export default self
