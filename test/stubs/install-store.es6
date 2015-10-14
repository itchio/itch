import Promise from 'bluebird'

export default {
  get_install: () => Promise.resolve({upload_id: 42}),
  archive_path: () => '/tmp/archive',
  app_path: () => '/tmp/app',
  '@noCallThru': true
}
