import { actions } from "common/actions";
import { LocalizedString } from "common/types";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import { addShortcut, removeShortcut, SteamError } from "main/steam/shortcuts";

const logger = mainLogger.child(__filename);

function errorMessage(e: unknown): LocalizedString {
  if (e instanceof SteamError) {
    switch (e.code) {
      case "no-steam":
        return ["steam.error.not_found"];
      case "no-user":
        return ["steam.error.no_user"];
      case "no-launcher":
        return ["steam.error.no_launcher"];
      case "steam-running":
        return ["steam.error.running"];
    }
  }
  return ["steam.error.generic", { message: String(e) }];
}

export default function (watcher: Watcher) {
  watcher.on(actions.addGameToSteam, async (store, action) => {
    const { game } = action.payload;
    try {
      await addShortcut(game);
      store.dispatch(
        actions.statusMessage({ message: ["steam.shortcut_added"] })
      );
    } catch (e) {
      logger.warn(`could not add ${game.title} to Steam: ${e}`);
      store.dispatch(actions.statusMessage({ message: errorMessage(e) }));
    }
  });

  watcher.on(actions.removeGameFromSteam, async (store, action) => {
    const { game } = action.payload;
    try {
      await removeShortcut(game.id);
      store.dispatch(
        actions.statusMessage({ message: ["steam.shortcut_removed"] })
      );
    } catch (e) {
      logger.warn(`could not remove ${game.title} from Steam: ${e}`);
      store.dispatch(actions.statusMessage({ message: errorMessage(e) }));
    }
  });
}
