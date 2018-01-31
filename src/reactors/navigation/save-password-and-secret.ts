// import rootLogger from "../../logger";
// const logger = rootLogger.child({ name: "save-password-and-secret" });

// import * as querystring from "querystring";
import { DB } from "../../db";
// import { Space } from "../../helpers/space";

export function doSave(path: string, query: string, db: DB) {
  // TODO: re-implement
  /*
  const sp = Space.fromInstance({ path });

  if (sp.prefix !== "games") {
    return;
  }

  const gameId = sp.numericId();
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
  */
}
