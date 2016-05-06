
import Promise from 'bluebird'

import dateFormat from 'dateformat'
import {pairs} from 'underline'
import colors from 'colors/safe'

import fs from 'fs'
import sf from '../util/sf'
import path from 'path'
import eol from 'eol'
import deepAssign from 'deep-assign'

function make (name) {
  let f = function (opts, message) {
    if (opts && opts.logger) {
      opts.logger.log(`[${name}] ${message}`)
    }
  }
  f.Logger = Logger
  return f
}

const allColors = 'red green yellow blue magenta cyan white gray'.split(' ')

export class Logger {
  constructor (userOpts) {
    if (typeof userOpts === 'undefined') {
      userOpts = {}
    }

    let defaultOpts = {sinks: {console: true}}
    let opts = deepAssign({}, defaultOpts, userOpts)

    let sinks = opts.sinks

    this.consoleSink = false
    this.stringSink = false
    this.fileSink = false
    this.contents = ''

    for (let pair of sinks::pairs()) {
      let key = pair[0]
      let val = pair[1]

      switch (key) {
        case 'console': {
          this.consoleSink = !!val
          break
        }

        case 'file': {
          if (val) {
            // XXX bad, but we're in a constructor, not seeing many other options
            try {
              fs.mkdirSync(path.dirname(val))
            } catch (err) {}
            this.fileSink = val
          }
          break
        }

        case 'string': {
          this.stringSink = !!val
          break
        }
      }
    }
  }

  log (message) {
    this.write(this.timestamp(), `${message}`)
  }

  nameToColor (name) {
    this.colorCache = this.colorCache || {}

    if (this.colorCache[name]) {
      return this.colorCache[name]
    }

    let hash = 0
    for (const i in name) {
      hash += name.charCodeAt(i)
    }
    hash = hash % allColors.length
    this.colorCache[name] = allColors[hash]

    return this.colorCache[name]
  }

  write (timestamp, s) {
    if (this.stringSink) {
      this.contents += eol.auto(`[${timestamp}] ${s}` + '\n')
    }

    if (this.consoleSink) {
      const matches = /^\[([^\]]*)\]/.exec(s)
      if (matches) {
        const color = this.nameToColor(matches[1])
        console.log(timestamp + ' ' + colors[color](s))
      } else {
        console.log(`${timestamp} ${s}`)
      }
    }

    if (this.fileSink) {
      sf.appendFile(this.fileSink, eol.auto(`${timestamp} ${s}` + '\n'))
    }
  }

  close () {
    return new Promise((resolve, reject) => {
      if (!this.fileSink) resolve()

      this.fileSink.on('finish', () => resolve())
      this.fileSink.end()
    })
  }

  timestamp () {
    return dateFormat(new Date(), '[yyyy-mm-dd @ HH:MM:ss]')
  }
}
make.Logger = Logger

export default make
