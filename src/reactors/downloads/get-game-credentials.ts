import { IGameCredentials } from "../../types";
import { IDownloadKey } from "../../db/models/download-key";
import Context from "../../context";

import { filter, findWhere, first } from "underscore";
import { Game } from "ts-itchio-api";

// TODO: handle passwords & secrets as well.

export default function getGameCredentials(
  ctx: Context,
  game: Game
): IGameCredentials {
  return getGameCredentialsInternal(ctx, game.id, game.inPressSystem);
}

export function getGameCredentialsForId(
  ctx: Context,
  gameId: number
): IGameCredentials {
  return getGameCredentialsInternal(ctx, gameId, false);
}

function getGameCredentialsInternal(
  ctx: Context,
  gameId: number,
  inPressSystem: boolean
): IGameCredentials {
  const state = ctx.store.getState();

  const currentUserCreds = state.session.credentials;
  if (!currentUserCreds || !currentUserCreds.me) {
    // not logged in :(
    return null;
  }

  if (currentUserCreds.me.pressUser && inPressSystem) {
    // we got full access, look no further!
    return {
      apiKey: currentUserCreds.key,
      downloadKey: null,
    };
  }

  // fish for a download key
  const allDownloadKeys = ctx.db.downloadKeys.find({ gameId });

  const sessions = state.rememberedSessions;
  const hasValidSession = (k: IDownloadKey) => {
    const session = sessions[k.ownerId];
    return !!(session && session.key);
  };

  const downloadKeys = filter(allDownloadKeys, hasValidSession);

  // prefer our key, if we have one
  const currentUserKey = findWhere(downloadKeys, {
    ownerId: currentUserCreds.me.id,
  });
  const downloadKey = currentUserKey || first(downloadKeys) || null;
  const apiKey = downloadKey
    ? sessions[downloadKey.ownerId].key
    : currentUserCreds.key;

  return {
    downloadKey,
    apiKey,
  };
}
