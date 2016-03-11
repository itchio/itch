
import env from '../env'

if (env.name === 'development') {
  require('bluebird').config({
    longStackTraces: true
  })
} else {
  require('bluebird').config({
    longStackTraces: false
  })
}
