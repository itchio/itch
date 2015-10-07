
import {numberFormat} from 'underscore.string'

let thresholds = [
  ['GB', Math.pow(1024, 3)],
  ['MB', Math.pow(1024, 2)],
  ['kB', 1024]
]

function format_bytes (bytes) {
  for (var [label, min] of thresholds) {
    if (bytes >= min) {
      return `${numberFormat(bytes / min)} ${label}`
    }
  }

  return `${numberFormat(bytes)} bytes`
}

export { format_bytes }
