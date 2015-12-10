#!/usr/bin/env node
(function () {
  'use strict'

  let path = require('path')
  let glob = require('glob')

  require('source-map-support').install()
  require('bluebird').config({
    longStackTraces: true,
    cancellation: true
  })
  require('babel-register')

  process.argv.slice(2).forEach((arg) => {
    glob(arg, function (e, files) {
      files.forEach(function (file) {
        let test = path.resolve(process.cwd(), file)
        require(test)
      })
    })
  })
})()
