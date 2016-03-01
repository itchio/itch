#! /usr/bin/env node
(function () {
  'use strict'
  /** requires node 4.2.x or higher because we use some ES6 features */

  const fs = require('fs')
  const path = require('path')
  const glob = require('glob')

  require('source-map-support').install()
  require('bluebird').config({
    longStackTraces: true
  })

  let is_dir = (f) => {
    try {
      return fs.lstatSync(f).isDirectory()
    } catch (e) {
      // probably a glob
    }
    return false
  }

  let args = process.argv.slice(2)
  if (args.length === 0) {
    args.push(path.resolve(__dirname, '..', 'test'))
  }

  for (let arg of args) {
    if (is_dir(arg)) {
      console.log(`Running all specs in ${arg}`)
      arg = `${arg}/**/*-spec.js`
    }

    glob(arg, function (e, files) {
      files.forEach(function (file) {
        // console.log(`Requiring ${file}`)
        let test = path.resolve(process.cwd(), file)
        require(test)
      })
    })
  }
})()
