
import {promisify} from "bluebird";
import Datastore from "nedb";

import {each, indexBy, map, omit} from "underscore";
import {camelifyObject} from "./format";

import mklog from "./log";
const log = mklog("legacy-db");
const opts = {logger: new mklog.Logger()};

/*
 * nedb was previously used for as both a persistent layer and
 * our single source of truth at runtime. that turned out to be
 * overkill & slower than expected. See 'util/market' for its replacement.
 */

async function importOldData (filename: string) {
  const store = new Datastore({filename, autoload: false});
  const loadDatabase = promisify(store.loadDatabase, {context: store});
  await loadDatabase();

  const find = promisify(store.find, {context: store});

  const caves = await find({_table: "caves"});
  const games = await find({_table: "games"});
  const collections = await find({_table: "collections"});
  const users = await find({_table: "users"});
  const downloadKeys = await find({_table: "download_keys"});

  each(caves, (x: any) => {
    if (x.hasOwnProperty("_id")) {
      x.id = x._id;
      delete x._id;
    }
  });

  const clean = (record: any) => camelifyObject(omit(record, "_id", "_table"));
  const cleanAll = (coll: any) => map(coll, clean);

  log(opts, `Imported ${caves.length} caves, ${games.length} games, ${collections.length} collections`
    + `, ${users.length} users and ${downloadKeys.length} download keys from ${filename}`);

  return {
    entities: {
      collections: indexBy(cleanAll(collections), "id"),
      downloadKeys: indexBy(cleanAll(downloadKeys), "id"),
      users: indexBy(cleanAll(users), "id"),
      caves: indexBy(cleanAll(caves), "id"),
      games: indexBy(cleanAll(games), "id"),
    },
  };
}

export default {importOldData};
