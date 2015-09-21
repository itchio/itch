
module.exports = {
  ext: (filename) ->
    filename.toLowerCase().match(/\.[\w]+$/)
}

