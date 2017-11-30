import { Watcher } from "../watcher";
import * as actions from "../../actions";
import { DB } from "../../db/db";
import { Instance, messages } from "node-buse";
import getGameCredentials from "../../reactors/downloads/get-game-credentials";
import Context from "../../context/index";
import { Upload } from "ts-itchio-api";
import { buseGameCredentials } from "../../util/buse-utils";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.manageGame, async (store, action) => {
    const { game } = action.payload;

    const caves = db.caves.all(k => k.where("gameId = ?", game.id));

    const ctx = new Context(store, db);

    const credentials = await getGameCredentials(ctx, game);
    if (!credentials) {
      throw new Error(`no game credentials, can't download`);
    }

    let allUploads: Upload[] = [];
    const instance = new Instance();
    instance.onClient(async client => {
      try {
        const res = await client.call(
          messages.Game.FindUploads({
            game,
            credentials: buseGameCredentials(credentials),
          })
        );
        allUploads = res.uploads;
      } catch (e) {
        console.log(`Could not fetch compatible uploads: ${e.stack}`);
      } finally {
        instance.cancel();
      }
    });
    await instance.promise();

    store.dispatch(
      // TODO: i18n
      actions.openModal({
        title: `Manage ${game.title}`,
        message: "",
        buttons: [],
        widget: "manage-game",
        widgetParams: {
          game,
          caves,
          allUploads,
        },
      })
    );
  });
}
