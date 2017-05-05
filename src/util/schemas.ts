
import {Schema, transform, arrayOf} from "idealizr";

export const game = new Schema("games");
export const user = new Schema("users");
export const collection = new Schema("collections");
export const downloadKey = new Schema("downloadKeys");

import moment = require("moment-timezone");

function parseDate(input: string) {
  return moment(`${input} +0000`, "YYYY-MM-DD HH:mm:ss Z").toDate();
}

const date = transform(parseDate);

game.define({
  user,
  created_at: date,
  published_at: date,
});
collection.define({
  games: arrayOf(game),
  created_at: date,
  updated_at: date,
});
downloadKey.define({
  game,
  created_at: date,
  updated_at: date,
});
