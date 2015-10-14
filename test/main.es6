import {walk} from 'walkdir'

// Read all test files.
let walker = walk(__dirname, { no_recurse: true })

walker.on('file', function (file) {
  let matches = file.match(/([^\/^\\]+-spec).js$/)
  if (!matches) return
  let modpath = `./${matches[1]}`
  require(modpath)
})
