#!/usr/bin/env node
(function () {
  'use strict'

  var path = require('path')
  var glob = require('glob')
  require('source-map-support').install()

  require('bluebird').config({
    longStackTraces: true,
    cancellation: true
  })
  require('nodent')()

  process.argv.slice(2).forEach((arg) => {
    glob(arg, function (e, files) {
      files.forEach(function (file) {
        let test = path.resolve(process.cwd(), file)
        console.log('> ' + test)
        require(test)
      })
    })
  })
})()
