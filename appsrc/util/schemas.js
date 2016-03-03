
import { Schema, arrayOf } from 'idealizr'

export const game = new Schema('games')
export const user = new Schema('users')
export const collection = new Schema('collections')
export const download_key = new Schema('download_keys')

game.define({ user })
collection.define({ games: arrayOf(game) })
download_key.define({ game })
