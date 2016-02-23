
module.exports = {
  find: async () => ({
    _id: 'kalamazoo',
    upload_id: 42,
    uploads: [ {id: 42, filename: 'hehe'} ],
    game: 84,
    launch_type: 'native'
  }),
  archive_path: () => '/tmp/archive',
  app_path: () => '/tmp/app',
  '@noCallThru': true,
  '@global': true
}
