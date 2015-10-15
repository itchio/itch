import Promise from 'bluebird'

let noop = () => Promise.resolve()

let user = {
  download_upload: noop,
  download_upload_with_key: noop,
  game_uploads: noop,
  download_key_uploads: noop
}

export default {
  get_current_user: () => user,
  '@noCallThru': true
}
