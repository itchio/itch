import { Watcher } from "common/util/watcher";

import * as urlParser from "common/util/url";
import querystring from "querystring";

import electron from "electron";
import { partitionForUser } from "common/util/partition-for-user";

import { actions } from "common/actions";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "itch-internal" });

export default function(watcher: Watcher) {
  watcher.on(actions.loginSucceeded, async (store, action) => {
    const userId = action.payload.profile.user.id;

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
      const params = flattenQuery(querystring.parse(query));
      const { tab } = params;

      logger.debug(`Got itch-internal request ${pathname}?${query} for ${tab}`);

      if (pathname === "/open-devtools") {
        store.dispatch(actions.openDevTools({ forApp: false }));
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

function flattenQuery(
  pqs: querystring.ParsedUrlQuery
): { [key: string]: string } {
  let res: { [key: string]: string } = {};
  for (const k of Object.keys(pqs)) {
    const vv = pqs[k];
    if (Array.isArray(vv)) {
      res[k] = vv[0];
    } else {
      res[k] = vv;
    }
  }
  return res;
}
