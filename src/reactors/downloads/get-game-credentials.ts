
import db from "../../db";
import Game from "../../db/models/game";
import DownloadKey from "../../db/models/download-key";
import {IStore} from "../../types";

import {filter, findWhere, first} from "underscore";

export interface IGameCredentials {
  apiKey: string;
  downloadKey?: number;
}

export default async function getGameCredentials(store: IStore, game: Game): Promise<IGameCredentials> {
  const state = store.getState();

  const currentUserCreds = state.session.credentials;
  if (!currentUserCreds || !currentUserCreds.me) {
    // not logged in :(
    return null;
  }

  if (currentUserCreds.me.pressUser && game.inPressSystem) {
    // we got full access, look no further!
    return {
      apiKey: currentUserCreds.key,
      downloadKey: null,
    };
  }

  // fish for a download key
  const allDownloadKeys = await db.downloadKeys.find({
    gameId: game.id,
  });
  
  const sessions = state.rememberedSessions;
  const hasValidSession = (k: DownloadKey) => {
    const session = sessions[k.ownerId];
    return !!(session && session.key);
  };

  const downloadKeys = filter(allDownloadKeys, hasValidSession);

  // prefer our key, if we have one
  const currentUserKey = findWhere(downloadKeys, {ownerId: currentUserCreds.me.id});
  const downloadKey = currentUserKey || first(downloadKeys);
  const apiKey = (downloadKey ? sessions[downloadKey.ownerId].key : currentUserCreds.key);

  return {
    downloadKey: downloadKey ? downloadKey.id : null,
    apiKey,
  };
}
