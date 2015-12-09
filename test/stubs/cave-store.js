'use nodent';'use strict'
let Promise = require('bluebird')

module.exports = {
  find: () => Promise.resolve({
    _id: 'kalamazoo',
    upload_id: 42,
    game_id: 84
  }),
  archive_path: () => '/tmp/archive',
  app_path: () => '/tmp/app',
  '@noCallThru': true,
  '@global': true
}
