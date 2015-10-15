
import {numberFormat} from 'underscore.string'

let thresholds = [
  ['GB', Math.pow(1024, 3)],
  ['MB', Math.pow(1024, 2)],
  ['kB', 1024]
]

let self = {
  format_bytes: function (bytes) {
    for (var [label, min] of thresholds) {
      if (bytes >= min) {
        return `${numberFormat(bytes / min)} ${label}`
      }
    }

    return `${numberFormat(bytes)} bytes`
  },

  camelize: function (str) {
    return str.replace(/(?:_[a-z])/g, function (letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase()
    }).replace(/_+/g, '')
  }
}

export default self
