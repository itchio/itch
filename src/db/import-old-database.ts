import { join, dirname } from "path";
import * as glob from "glob";
import * as fs from "fs";
import { app } from "electron";

import { toDateTimeField } from "./datetime-field";
import { toJSONField } from "./json-field";

import { ICave } from "./models/cave";
import { IGame } from "./models/game";
import { ICollection } from "./models/collection";
import { IUser } from "./models/user";
import { IProfile } from "./models/profile";
import { IDownloadKey } from "./models/download-key";

import { IUpload, InstallerType, ITableMap } from "../types";

import { Logger } from "../logger";

// see https://github.com/itchio/itch/blob/5af1c6455879afc47efc11faf727028b188d67c6/appsrc/util/pathmaker.ts
// and https://github.com/itchio/itch/blob/5af1c6455879afc47efc11faf727028b188d67c6/appsrc/util/market.ts
// for references on the now-dead marketdb

import { DB } from ".";

interface IImportOpts {
  db: DB;
  userDataPath: string;
  logger: Logger;
}

interface IImportResult {
  caves: {
    [key: string]: ICave;
  };
  games: {
    [key: string]: IGame;
  };
  users: {
    [key: string]: IUser;
  };
  collections: {
    [key: string]: ICollection;
  };
  profiles: {
    [key: string]: IProfile;
  };
  downloadKeys: {
    [key: string]: IDownloadKey;
  };
}

const emptyObj = {};

function merge(res: IImportResult, tableName: string, id: string, data: any) {
  const table = res[tableName];
  table[id] = {
    ...table[id] || emptyObj,
    ...data,
  };
}

function saveGame(out: IImportResult, game: any) {
  if (!game || !game.id) {
    return;
  }
  merge(out, "games", game.id, game);
}
/**
 * Import all marketdb databases into the SQLite database
 */
export function importOldDatabases(opts: IImportOpts) {
  const userData = app.getPath("userData");

  const usersDir = join(userData, "users");
  const userMarketPaths = glob.sync("*/marketdb/", { cwd: usersDir });

  const out: IImportResult = {
    games: {},
    users: {},
    collections: {},
    profiles: {},
    caves: {},
    downloadKeys: {},
  };

  for (const userMarketPath of userMarketPaths) {
    const userId = parseInt(dirname(userMarketPath), 10);
    if (isNaN(userId)) {
      return false;
    }
    const absoluteUserMarketPath = join(usersDir, userMarketPath);
    importUserMarkets(opts, out, absoluteUserMarketPath, userId);
  }

  const globalMarketPath = join(userData, "marketdb");
  importGlobalMarket(opts, out, globalMarketPath);

  const { db } = opts;
  db.saveMany((out as any) as ITableMap);
}

interface IObjectMap {
  [key: string]: any;
}

/**
 * Read all flat JSON records from a marketdb table directory,
 * return them indexed by ID. Skips (and logs) malformed ones.
 */
function readAllRecords(
  opts: IImportOpts,
  marketPath: string,
  tableName: string
): IObjectMap {
  const tableDir = join(marketPath, tableName);
  const ids = glob.sync("*", { cwd: tableDir });
  const res: IObjectMap = {};

  const { logger } = opts;

  for (const id of ids) {
    try {
      const recordPath = join(tableDir, id);
      const contents = fs.readFileSync(recordPath, { encoding: "utf8" });
      const obj = JSON.parse(contents);
      res[id] = obj;
    } catch (e) {
      logger.warn(`Skipping ${tableName}/${id}: ${e.message}`);
    }
  }

  logger.info(
    `Read ${Object.keys(ids).length} ${tableName} from ${marketPath}`
  );

  return res;
}

export function importUserMarkets(
  opts: IImportOpts,
  out: IImportResult,
  marketPath: string,
  userId: number
) {
  const games = readAllRecords(opts, marketPath, "games");
  for (const id of Object.keys(games)) {
    const gameIn = games[id];
    const gameOut: IGame = {
      id: gameIn.id,
      url: gameIn.url,
      userId: gameIn.userId,
      title: gameIn.title,
      shortText: gameIn.shortText,

      type: gameIn.type,
      classification: gameIn.classification,
      coverUrl: gameIn.coverUrl,
      stillCoverUrl: gameIn.stillCoverUrl,

      createdAt: toDateTimeField(gameIn.createdAt),
      publishedAt: toDateTimeField(gameIn.publishedAt),

      canBeBought: gameIn.canBeBought,
      currency: gameIn.currency,
      minPrice: gameIn.minPrice,
      hasDemo: gameIn.hasDemo,
      inPressSystem: gameIn.inPressSystem,

      pAndroid: gameIn.pAndroid,
      pLinux: gameIn.pLinux,
      pOsx: gameIn.pOsx,
      pWindows: gameIn.pWindows,

      embed: toJSONField(gameIn.embed),
      sale: toJSONField(gameIn.sale),
    };

    saveGame(out, gameOut);
  }

  const users = readAllRecords(opts, marketPath, "users");
  for (const id of Object.keys(users)) {
    const userIn = users[id];
    const userOut: IUser = {
      id: userIn.id,
      url: userIn.url,
      username: userIn.username,
      displayName: userIn.displayName,

      coverUrl: userIn.coverUrl,
      stillCoverUrl: userIn.stillCoverUrl,
    };

    merge(out, "users", String(userOut.id), userOut);
  }

  const collections = readAllRecords(opts, marketPath, "collections");
  for (const id of Object.keys(collections)) {
    const collectionIn = collections[id];
    const collectionOut: ICollection = {
      id: collectionIn.id,
      title: collectionIn.title,
      userId: userId,

      createdAt: toDateTimeField(collectionIn.createdAt),
      updatedAt: toDateTimeField(collectionIn.updatedAt),

      gameIds: toJSONField(collectionIn.gameIds),
      gamesCount: collectionIn.gamesCount,
    };

    merge(out, "collections", String(collectionOut.id), collectionOut);
  }

  const downloadKeys = readAllRecords(opts, marketPath, "downloadKeys");
  for (const id of Object.keys(downloadKeys)) {
    const downloadKeyIn = downloadKeys[id];
    const downloadKeyOut: IDownloadKey = {
      id: downloadKeyIn.id,

      ownerId: userId,

      createdAt: toDateTimeField(downloadKeyIn.createdAt),
      updatedAt: toDateTimeField(downloadKeyIn.updatedAt),

      gameId: downloadKeyIn.gameId,
    };

    merge(out, "downloadKeys", String(downloadKeyOut.id), downloadKeyOut);
  }

  const itchAppTabs = readAllRecords(opts, marketPath, "itchAppTabs");
  const itchAppProfile = readAllRecords(opts, marketPath, "itchAppProfile");

  const profileOut: IProfile = {
    id: userId,
    myGameIds: toJSONField(null),
    myCollectionIds: toJSONField(null),
    openTabs: toJSONField(null),
  };

  // sic. - yep, was using "x" as a key to store a "singleton" object
  // in marketdb.
  const xTabs = itchAppTabs.x;
  if (xTabs) {
    profileOut.openTabs = toJSONField(xTabs);
  }

  const myGames = itchAppProfile.myGames;
  if (myGames) {
    profileOut.myGameIds = toJSONField(myGames.ids);
  }

  merge(out, "profiles", String(profileOut.id), profileOut);
}

export function importGlobalMarket(
  opts: IImportOpts,
  out: IImportResult,
  marketPath: string
) {
  const { logger } = opts;

  const caves = readAllRecords(opts, marketPath, "caves");
  for (const id of Object.keys(caves)) {
    try {
      const caveIn = caves[id];

      // old:
      //   uploadId: uploadId
      //   uploads: { [uploadId]: actualUpload }
      //
      // new:
      //   upload: actualUpload
      const uploadId = caveIn.uploadId;
      let upload: IUpload = null;
      if (caveIn.uploads && caveIn.uploads[uploadId]) {
        upload = caveIn.uploads[uploadId];
      }

      // old:
      //   installerCache: { [uploadId]: "archive" }
      //   archiveNestedCache: { [uploadId]: "exe" }
      //   installerExeCache: { [uploadId]: "inno" }
      //
      // new:
      //   installerType: "inno"
      let installerType: InstallerType = "archive";
      if (caveIn.installerCache && caveIn.installerCache[uploadId]) {
        installerType = caveIn.installerCache[uploadId];
        if (installerType === "archive") {
          if (
            caveIn.installerNestedCache &&
            caveIn.installerNestedCache[uploadId]
          ) {
            const nestedType = caveIn.installerNestedCache[uploadId];
            if (nestedType === "exe") {
              if (
                caveIn.installerExeCache &&
                caveIn.installerExeCache[uploadId]
              ) {
                installerType = caveIn.installer;
              } else {
                // nested exe but no installerExeCache? oh boy,
                // some registry entries are going to linger. sorry :(
                // let's fall back to something sane:
                installerType = "archive";
              }
            } else {
              installerType = nestedType;
            }
          }
        }
      }

      let gameId: number = null;
      if (caveIn.game) {
        gameId = caveIn.game.id;
        saveGame(out, caveIn.game);
      }

      const caveOut: ICave = {
        id,
        gameId,
        externalGameId: null,

        upload: toJSONField(upload),
        handPicked: caveIn.handPicked,

        installLocation: caveIn.installLocation,
        installFolder: caveIn.installFolder,
        installerType,
        pathScheme: caveIn.pathScheme,

        channelName: caveIn.channelName,
        buildId: caveIn.buildId,
        buildUserVersion: caveIn.buildUserVersion,
        installedAt: toDateTimeField(caveIn.installedAt),

        installedPrereqs: toJSONField(caveIn.installedPrereqs),

        /**
         * throw away old `executables: string[]` field,
         * let butler re-configure all games on next launch.
         * 
         * alea jacta est!
         */
        verdict: null,
        installedSize: caveIn.installedSize,
        installedUE4Prereq: caveIn.installedUE4Prereq,

        lastTouchedAt: toDateTimeField(caveIn.lastTouchedAt),
        secondsRun: parseInt(caveIn.secondsRun, 10),
      };

      merge(out, "caves", caveOut.id, caveOut);
    } catch (e) {
      logger.warn(`Couldn't import cave ${id}: ${e.stack}`);
    }
  }
}
