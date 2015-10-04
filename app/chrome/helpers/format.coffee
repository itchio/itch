
_str = require "underscore.string"

format_bytes = do ->
  thresholds = [
    ["GB", Math.pow 1024, 3]
    ["MB", Math.pow 1024, 2]
    ["kB", 1024]
  ]

  (bytes) ->
    for [label, min] in thresholds
      if bytes >= min
        return "#{_str.numberFormat bytes / min}#{label}"

    "#{_str.numberFormat bytes} bytes"

module.exports = {
  format_bytes
}

