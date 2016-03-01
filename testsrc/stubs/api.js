
let noop = async () => null

let user = {
  me: noop,
  download_upload: noop,
  download_upload_with_key: noop,
  game_uploads: noop,
  download_key_uploads: noop,
  my_owned_keys: noop,
  my_games: noop,
  my_collections: noop,
  collection: noop,
  collection_games: noop
}

let User = function () {
  Object.assign(this, user)
}

let client = {
  login_key: noop,
  login_with_password: noop
}

let self = {
  client,
  user,
  User,
  '@noCallThru': true
}

export default self
