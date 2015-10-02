
module.exports = {
  # return '.zip', '.exe', etc given any file path. Always lowercase.
  ext: (filename) ->
    filename.toLowerCase().match(/\.[\w]+$/)
}

