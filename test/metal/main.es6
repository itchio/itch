import {walk} from 'walkdir'

process.env['BLUEBIRD_DEBUG'] = 1

// Read all test files.
let dir = __dirname
console.log(`Walking ${dir}`)
let walker = walk(dir, { no_recurse: true })

walker.on('file', function (file) {
  let matches = file.match(/([^\/]+-spec).js$/)
  if (matches) {
    let modpath = `./${matches[1]}`
    console.log(`Requiring ${modpath}`)
    require(modpath)
  }
})
