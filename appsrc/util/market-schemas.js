
import { Schema, arrayOf } from 'idealizr'

const user = new Schema('users')
const game = new Schema('games')
const collection = new Schema('collections')
const download_key = new Schema('download_keys')

/* Schemas */

game.define({
  user: user
})

collection.define({
  games: arrayOf(game)
})

download_key.define({
  game: game
})
