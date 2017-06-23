import suite from "../../test-suite";
import * as proxyquire from "proxyquire";

import _getGameCredentials, * as ggcModule from "./get-game-credentials";
import { DB } from "../../db";

import { IStore, IAppState } from "../../types";

const state = ({
  session: {
    credentials: null,
  },
} as any) as IAppState;

const store = ({
  getState: () => state,
} as any) as IStore;

const db = new DB();

const proxyquired = proxyquire("./get-game-credentials", {
  "../../db": {
    __esModule: true,
    default: db,
  },
  "@global": true,
  "@noCallThru": true,
});
const getGameCredentials = proxyquired.default as typeof _getGameCredentials;
const getGameCredentialsForId = proxyquired.getGameCredentialsForId as typeof ggcModule.getGameCredentialsForId;

suite(__filename, s => {
  s.case("getGameCredentials", async t => {
    await db.load(store, ":memory:");
    const game: any = {
      id: 728,
    };
    t.same(
      await getGameCredentials(store, game),
      null,
      "no credentials when logged out",
    );

    const credentials19 = {
      key: "api-key-19",
      me: {
        id: 19,
        pressUser: true,
      } as any,
    };

    const credentials75 = {
      key: "api-key-75",
      me: {
        id: 75,
      } as any,
    };

    state.session.credentials = credentials19;

    state.rememberedSessions = {};
    state.rememberedSessions[credentials19.me.id] = {
      ...credentials19,
      lastConnected: Date.now(),
    };
    state.rememberedSessions[credentials75.me.id] = {
      ...credentials75,
      lastConnected: Date.now(),
    };

    game.inPressSystem = true;

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials19.key,
        downloadKey: null,
      },
      "api key only when press access is allowed",
    );

    credentials19.me.pressUser = false;

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials19.key,
        downloadKey: null,
      },
      "api key only when not a press user",
    );

    credentials19.me.pressUser = true;
    game.inPressSystem = false;

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials19.key,
        downloadKey: null,
      },
      "api key only when game not in press system",
    );

    const dk190 = await db.downloadKeys.persist(
      db.downloadKeys.create({
        id: 190,
        gameId: game.id,
        ownerId: credentials19.me.id,
      }),
    );

    const dk750 = await db.downloadKeys.persist(
      db.downloadKeys.create({
        id: 750,
        gameId: game.id,
        ownerId: credentials75.me.id,
      }),
    );

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials19.key,
        downloadKey: dk190,
      },
      "prefer current user download key",
    );

    state.session.credentials = credentials75;

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials75.key,
        downloadKey: dk750,
      },
      "prefer current user download key (bis)",
    );

    await db.downloadKeys.remove(
      {
        id: 750,
      } as any,
    );

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials19.key,
        downloadKey: dk190,
      },
      "will take other user's download key",
    );

    delete state.rememberedSessions[credentials19.me.id];

    t.same(
      await getGameCredentials(store, game),
      {
        apiKey: credentials75.key,
        downloadKey: null,
      },
      "won't take other user's download key if we don't have corresponding API key",
    );

    t.same(
      await getGameCredentialsForId(store, game.id),
      {
        apiKey: credentials75.key,
        downloadKey: null,
      },
      "looks up properly by id alone too",
    );
  });
});
