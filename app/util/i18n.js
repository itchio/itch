let preferences = require('./preferences')
let i18n = require('i18n')

i18n.configure({
  locales: ['en', 'es'],
  directory: __dirname + '../../static/locales',
  defaultLocale: preferences.read('language') || 'en'
})

module.exports = i18n
