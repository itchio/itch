import { Watcher } from "./watcher";

import * as urlParser from "url";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "reactors/url" });

import { isItchioURL } from "../util/url";
import { reportIssue } from "../util/crash-reporter";
import urls from "../constants/urls";

import { shell } from "electron";

import { actions } from "../actions";
import { IStore } from "../types";

import { filter } from "underscore";
import { call, messages } from "../butlerd";

export default function(watcher: Watcher) {
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

    const { me } = store.getState().profile.credentials;
    if (me) {
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
    const url = store.getState().profile.credentials.me.url;
    store.dispatch(actions.navigate({ url }));
  });

  watcher.on(actions.viewCommunityProfile, async (store, action) => {
    const url = store.getState().profile.credentials.me.url;
    const host = urlParser.parse(url).hostname;
    const slug = /^[^.]+/.exec(host);
    store.dispatch(actions.navigate({ url: `${urls.itchio}/profile/${slug}` }));
  });

  watcher.on(actions.reportIssue, async (store, action) => {
    // TODO: that's dirty, just make sure every time we call reportIssue, we have
    // a non-null payload
    const { log: issueLog } = action.payload || { log: null };

    reportIssue({
      body: "Dear itch app team, ",
      log: issueLog,
    });
  });
}

function handleItchioUrl(store: IStore, uri: string) {
  logger.info(`Processing itchio uri (${uri})`);

  try {
    const url = urlParser.parse(uri);

    let tokens = url.pathname.split("/");
    tokens = filter(tokens, x => !!x);
    tokens = [url.hostname, ...tokens];
    logger.info(`tokens = ${tokens.join(" ::: ")}`);

    switch (tokens[0]) {
      case "games": {
        if (!tokens[1]) {
          logger.warn(`missing gameId for ${url}, ignoring`);
          return;
        }
        const gameId = parseInt(tokens[1], 10);

        (async () => {
          try {
            let navigated = false;
            await call(messages.FetchGame, { gameId }, async client => {
              client.onNotification(messages.FetchGameYield, ({ params }) => {
                if (navigated) {
                  return;
                }
                navigated = true;
                const { game } = params;
                store.dispatch(actions.navigateToGame({ game }));
              });
            });
          } catch (e) {
            store.dispatch(
              actions.statusMessage({ message: `Game ${gameId} not found` })
            );
          }
        })().catch(e => {
          /* ignore */
        });
        break;
      }
      default:
        logger.warn(`no host for ${uri}, ignoring`);
        return;
    }
  } catch (e) {
    logger.warn(`while processing ${uri}: ${e.stack}`);
    return;
  }
}
