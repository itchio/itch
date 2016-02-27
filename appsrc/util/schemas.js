
import { Schema, arrayOf } from 'idealizr'

const game = new Schema('games')
const user = new Schema('users')
const collection = new Schema('collections')
const download_key = new Schema('download_keys')

game.define({ user })
collection.define({ games: arrayOf(game) })
download_key.define({ game })

module.exports = {
  game, user, collection, download_key
}
