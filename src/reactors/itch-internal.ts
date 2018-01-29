import { Watcher } from "./watcher";

import urlParser from "../util/url";
import * as querystring from "querystring";

import * as electron from "electron";
import partitionForUser from "../util/partition-for-user";

import { actions } from "../actions";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "itch-internal" });

export default function(watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const userId = action.payload.me.id;

    logger.debug(`Setting up for user ${userId}`);

    const session = electron.session.fromPartition(
      partitionForUser(String(userId)),
      { cache: true }
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

      if (pathname === "/open-devtools") {
        store.dispatch(actions.openDevTools({ forApp: false }));
      } else if (pathname === "/analyze-page") {
        store.dispatch(
          actions.analyzePage({
            tab,
            url: params.url,
            iframe: params.iframe,
          })
        );
      } else if (pathname === "/evolve-tab") {
        store.dispatch(actions.evolveTab({ tab: tab, path: params.path }));
      } else {
        logger.warn(
          `Got unrecognized message via itch-internal: ${pathname}, params ${JSON.stringify(
            params
          )}`
        );
      }
    });
  });
}
