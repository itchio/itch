'use strict'

let pairs = require('underscore').pairs
let fstream = require('fstream')
let deep_assign = require('deep-assign')

function make (name) {
  return function (opts, message) {
    if (opts && opts.logger) {
      opts.logger.log(`[${name}] ${message}`)
    }
  }
}

class Logger {
  constructor (user_opts) {
    if (typeof user_opts === 'undefined') {
      user_opts = {}
    }

    let default_opts = {sinks: {console: true}}
    let opts = deep_assign({}, default_opts, user_opts)

    let sinks = opts.sinks

    this.console_sink = false
    this.string_sink = false
    this.file_sink = false
    this.contents = ''

    for (let pair of pairs(sinks)) {
      let key = pair[0]
      let val = pair[1]

      switch (key) {
        case 'console': {
          this.console_sink = !!val
          break
        }

        case 'file': {
          if (val) {
            this.file_sink = fstream.Writer({
              path: val,
              flags: 'a'
            })
          }
          break
        }

        case 'string': {
          this.string_sink = !!val
          break
        }
      }
    }
  }

  log (message) {
    this.write(`[${this.timestamp()}] ${message}`)
  }

  write (s) {
    if (this.string_sink) {
      this.contents += s
      this.contents += '\n'
    }

    if (this.console_sink) {
      console.log(s)
    }

    if (this.file_sink) {
      this.file_sink.write(s)
      this.file_sink.write('\n')
    }
  }

  close () {
    return new Promise((resolve, reject) => {
      if (!this.file_sink) resolve()

      this.file_sink.on('finish', () => resolve())
      this.file_sink.end()
    })
  }

  timestamp () {
    return new Date().toUTCString()
  }
}
make.Logger = Logger

module.exports = make
