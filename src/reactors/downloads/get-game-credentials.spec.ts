import suite, { withDB } from "../../test-suite";

import getGameCredentials, {
  getGameCredentialsForId,
} from "./get-game-credentials";
import Context from "../../context";

import { IStore, ICredentials, IRootState } from "../../types";
import { IGame } from "../../db/models/game";
import { IDownloadKey } from "../../db/models/download-key";

const state = ({
  session: {
    credentials: null,
  },
} as any) as IRootState;

const store = ({
  getState: () => state,
  dispatch: () => null,
} as any) as IStore;

suite(__filename, s => {
  s.case("getGameCredentials", async t => {
    await withDB(store, async db => {
      const ctx = new Context(store, db);

      const game = ({
        id: 728,
      } as any) as IGame;
      let gc = await getGameCredentials(ctx, game);
      t.same(gc, null, "no credentials when logged out");

      const c19 = ({
        key: "api-key-19",
        me: {
          id: 19,
          pressUser: true,
        } as any,
      } as any) as ICredentials;

      const c75 = ({
        key: "api-key-75",
        me: {
          id: 75,
        } as any,
      } as any) as ICredentials;

      state.session.credentials = c19;

      state.rememberedSessions = {};
      state.rememberedSessions[c19.me.id] = {
        ...c19,
        lastConnected: Date.now(),
      };
      state.rememberedSessions[c75.me.id] = {
        ...c75,
        lastConnected: Date.now(),
      };

      game.inPressSystem = true;

      gc = await getGameCredentials(ctx, game);
      t.same(gc.apiKey, c19.key, "api key only when press access is allowed");

      c19.me.pressUser = false;

      gc = await getGameCredentials(ctx, game);
      t.same(gc.apiKey, c19.key, "api key only when not a press user");

      c19.me.pressUser = true;
      game.inPressSystem = false;

      gc = await getGameCredentials(ctx, game);
      t.same(gc.apiKey, c19.key, "api key only when game not in press system");

      const dk190 = ({
        id: 190,
        gameId: game.id,
        ownerId: c19.me.id,
      } as any) as IDownloadKey;
      db.saveOne("downloadKeys", dk190.id, dk190);

      const dk750 = ({
        id: 750,
        gameId: game.id,
        ownerId: c75.me.id,
      } as any) as IDownloadKey;
      db.saveOne("downloadKeys", dk750.id, dk750);

      gc = await getGameCredentials(ctx, game);
      t.same(gc.downloadKey.id, dk190.id, "prefer current user download key 1");

      state.session.credentials = c75;

      gc = await getGameCredentials(ctx, game);
      t.same(gc.downloadKey.id, dk750.id, "prefer current user download key 2");

      db.downloadKeys.delete(k => k.where("id = ?", 750));

      gc = await getGameCredentials(ctx, game);
      t.same(
        { api: gc.apiKey, download: gc.downloadKey.id },
        { api: c19.key, download: dk190.id },
        "will take other user's download key"
      );

      delete state.rememberedSessions[c19.me.id];

      gc = await getGameCredentials(ctx, game);
      t.notOk(
        gc.downloadKey,
        "won't take other user's download key if we don't have corresponding API key"
      );

      gc = await getGameCredentialsForId(ctx, game.id);
      t.same(gc.apiKey, c75.key, "looks up properly by id alone too");
    });
  });
});
