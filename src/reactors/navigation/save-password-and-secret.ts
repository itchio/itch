import { pathPrefix, pathToId, pathQuery } from "../../util/navigation";
import { Watcher } from "../watcher";
import * as actions from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "save-password-and-secret" });

import * as querystring from "querystring";
import { DB } from "../../db";

export function doSave(path: string, db: DB) {
  const prefix = pathPrefix(path);
  if (prefix !== "games") {
    return;
  }

  const gameId = pathToId(path);

  const query = pathQuery(path);
  const parsed = querystring.parse(query);

  if (parsed.password) {
    logger.debug(`Remembering password for game ${gameId}`);
    db.saveOne("gamePasswords", gameId, {
      id: +gameId,
      password: parsed.password,
    });
  }

  if (parsed.secret) {
    logger.debug(`Remembering secret for game ${gameId}`);
    db.saveOne("gameSecrets", gameId, {
      id: +gameId,
      secret: parsed.secret,
    });
  }
}

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.evolveTab, async (store, action) => {
    doSave(action.payload.path, db);
  });
}
