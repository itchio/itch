import { Watcher } from "./watcher";

import urlParser from "../util/url";
import * as querystring from "querystring";

import * as electron from "electron";
import partitionForUser from "../util/partition-for-user";

import * as actions from "../actions";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "itch-internal" });

export default function(watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const userId = action.payload.me.id;

    logger.debug("Setting up for user", userId);

    const session = electron.session.fromPartition(
      partitionForUser(String(userId)),
      { cache: true },
    );

    // requests to 'itch-internal' are used to communicate between web content & the app
    const internalFilter = {
      urls: ["https://itch-internal/*"],
    };

    session.webRequest.onBeforeRequest(internalFilter, (details, callback) => {
      callback({ cancel: true });

      let parsed = urlParser.parse(details.url);
      const { pathname, query } = parsed;
      const params = querystring.parse(query);
      const { tab } = params;

      logger.debug(`Got itch-internal request ${pathname}?${query} for ${tab}`);

      switch (pathname) {
        case "/open-devtools":
          store.dispatch(actions.openDevTools({ tab }));
          const { webview } = this;
          if (
            webview &&
            webview.getWebContents() &&
            !webview.getWebContents().isDestroyed()
          ) {
            webview.getWebContents().openDevTools({ mode: "detach" });
          }
          break;
        case "/analyze-page":
          const a = actions.analyzePage({
            tab,
            url: params.url,
            iframe: params.iframe,
          });
          logger.info(`Dispatching action: ${JSON.stringify(a, null, 2)}`);
          store.dispatch(a);
          break;
        case "/evolve-tab":
          store.dispatch(actions.evolveTab({ tab: tab, path: params.path }));
          break;
        default:
          logger.warn(
            `Got unrecognized message via itch-internal: ${pathname}, params`,
            params,
          );
          break;
      }
    });
  });
}
