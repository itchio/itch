
import {Schema, transform, arrayOf} from "idealizr";

export const game = new Schema("games");
export const user = new Schema("users");
export const collection = new Schema("collections");
export const downloadKey = new Schema("downloadKeys");

function parseDate(input: string) {
  // without `+0` it parses a local date - this is the fastest
  // way to parse a UTC date.
  // see https://jsperf.com/parse-utc-date
  const date = new Date(input + "+0");
  // we don't store milliseconds in the db anyway,
  // so let's just discard it here
  date.setMilliseconds(0);
  return date;
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
