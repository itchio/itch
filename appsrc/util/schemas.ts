
import {Schema, arrayOf} from "idealizr";

export const game = new Schema("games");
export const user = new Schema("users");
export const collection = new Schema("collections");
export const downloadKey = new Schema("downloadKeys");

game.define({user});
collection.define({games: arrayOf(game)});
downloadKey.define({game});
