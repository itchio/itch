
import {pairs} from 'underscore'
import mkdirp from 'mkdirp'
import path from 'path'
import fs from 'fs'
import deep_assign from 'deep-assign'

function make (name) {
  return function (opts, message) {
    if (opts.logger == null) {
      return
    }
    opts.logger.log(`[${name}] ${message}`)
  }
}

class Logger {
  constructor (user_opts = {}) {
    let default_opts = {sinks: {console: true}}
    let opts = deep_assign(default_opts, user_opts)

    let {sinks} = opts

    this.console_sink = false
    this.string_sink = false
    this.file_sink = false
    this.contents = ''

    for (let [key, val] of pairs(sinks)) {
      switch (key) {
        case 'console': {
          this.console_sink = true
          break
        }

        case 'file': {
          mkdirp.sync(path.dirpath(val))
          this.file_sink = fs.createWriteStream(val, {
            flags: 'a',
            defaultEncoding: 'utf8'
          })
          break
        }

        case 'string': {
          this.string_sink = true
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

  timestamp () {
    return new Date().toUTCString()
  }
}
make.Logger = Logger

export default make
