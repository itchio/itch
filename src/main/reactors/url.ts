import { actions } from "common/actions";
import urls from "common/constants/urls";
import { Store } from "common/types";
import { isItchioURL } from "common/util/url";
import { Watcher } from "common/util/watcher";
import { shell } from "electron";
import { mainLogger } from "main/logger";
import { modals } from "common/modals";
import urlParser from "url";
import querystring from "querystring";
import { doAsync } from "renderer/helpers/doAsync";
import { queueInstall } from "main/reactors/tasks/queue-game";
import { mcall } from "main/butlerd/mcall";
import { messages } from "common/butlerd";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.on(actions.processUrlArguments, async (store, action) => {
    const { args } = action.payload;
    for (const uri of args) {
      if (isItchioURL(uri)) {
        store.dispatch(actions.handleItchioURI({ uri }));
        break;
      }
    }
  });

  watcher.on(actions.openInExternalBrowser, async (store, action) => {
    const uri = action.payload.url;
    shell.openExternal(uri);
  });

  watcher.on(actions.handleItchioURI, async (store, action) => {
    const { uri } = action.payload;

    const { profile } = store.getState().profile;
    if (profile) {
      handleItchioUrl(store, uri);
    } else {
      logger.info(`Queuing ${uri} for later...`);
      store.dispatch(actions.pushItchioURI({ uri }));
    }
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    const uris = store.getState().profile.itchioUris;
    store.dispatch(actions.clearItchioURIs({}));

    for (const uri of uris) {
      handleItchioUrl(store, uri);
    }
  });

  watcher.on(actions.viewCreatorProfile, async (store, action) => {
    const url = store.getState().profile.profile.user.url;
    store.dispatch(actions.navigate({ wind: "root", url }));
  });

  watcher.on(actions.viewCommunityProfile, async (store, action) => {
    const url = store.getState().profile.profile.user.url;
    const host = urlParser.parse(url).hostname;
    const slug = /^[^.]+/.exec(host);
    store.dispatch(
      actions.navigate({
        wind: "root",
        url: `${urls.itchio}/profile/${slug}`,
      })
    );
  });

  watcher.on(actions.sendFeedback, async (store, action) => {
    const { log } = action.payload;

    store.dispatch(
      actions.openModal(
        modals.sendFeedback.make({
          wind: "root",
          title: ["send_feedback.title"],
          widgetParams: {
            log,
          },
        })
      )
    );
  });
}

/**
 * Returns true if it was an action URL
 */
export function handleItchioUrl(store: Store, uri: string): boolean {
  logger.info(`Processing itchio uri (${uri})`);
  let url = uri.replace(/^[^:]+:/, "itch:");
  const parsedURL = urlParser.parse(url);
  if (parsedURL.hostname === "install") {
    doAsync(async () => {
      const queryParams = querystring.parse(parsedURL.query);
      const gameId = parseInt(queryParams["game_id"] as string, 10);
      const uploadId = parseInt(queryParams["upload_id"] as string, 10);
      logger.info(`Should queue install because of URL: ${url}`);
      const { game } = await mcall(messages.FetchGame, { gameId });
      await queueInstall(store, game, uploadId);
    });
    return true;
  }

  store.dispatch(actions.navigate({ wind: "root", url }));
  return false;
}
