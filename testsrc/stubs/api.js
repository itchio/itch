
import test from 'zopf'
const noop = async () => null

const user = {
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

const User = function () {
  Object.assign(this, user)
}

const client = {
  login_key: noop,
  login_with_password: noop
}

module.exports = test.module({ client, user, User })
