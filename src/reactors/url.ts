
import {Watcher} from "./watcher";

import * as urlParser from "url";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "reactors/url"});

import {isItchioURL} from "../util/url";
import crashReporter from "../util/crash-reporter";
import urls from "../constants/urls";

import {shell} from "electron";

import * as actions from "../actions";

let onSessionReady: () => void;

export default function (watcher: Watcher) {
  watcher.on(actions.openUrl, async (store, action) => {
    const uri = action.payload.url;
    if (isItchioURL(uri)) {
      store.dispatch(actions.handleItchioUrl({uri}));
    } else {
      shell.openExternal(uri);
    }
  });

  watcher.on(actions.handleItchioUrl, async (store, action) => {
    const {uri} = action.payload;

    logger.info(`Starting to handle itch.io url ${uri}`);
    const key = store.getState().session.credentials.key;
    if (!key) {
      logger.info("Waiting for session to be ready before handling itchio url");
      await new Promise((resolve, reject) => {
        onSessionReady = resolve;
      });
    }

    const url = urlParser.parse(uri);
    const verb = url.hostname;
    const tokens = url.pathname.split("/");

    switch (verb) {
      case "install":
      case "launch": {
        if (!tokens[1]) {
          logger.warn("for install: missing game, bailing out.");
          return;
        }
        const gameId = tokens[1];
        store.dispatch(actions.navigate("games/" + gameId));
        break;
      }

      default: {
        const resourcePath = url.hostname + url.pathname;
        logger.info(`Opening resource directly: ${resourcePath}`);
        store.dispatch(actions.navigate(resourcePath));
      }
    }
  });

  watcher.on(actions.sessionReady, async (store, action) => {
    if (onSessionReady) {
      onSessionReady();
    }
  });

  watcher.on(actions.viewCreatorProfile, async (store, action) => {
    const url = store.getState().session.credentials.me.url;
    store.dispatch(actions.navigate("url/" + url));
  });

  watcher.on(actions.viewCommunityProfile, async (store, action) => {
    const url = store.getState().session.credentials.me.url;
    const host = urlParser.parse(url).hostname;
    const slug = /^[^.]+/.exec(host);
    store.dispatch(actions.navigate("url/" + `${urls.itchio}/profile/${slug}`));
  });

  watcher.on(actions.reportIssue, async (store, action) => {
    // TODO: that's dirty, just make sure every time we call reportIssue, we have
    // a non-null payload
    const {log: issueLog} = action.payload || {log: null};

    crashReporter.reportIssue({
      body: "Dear itch app team, ",
      log: issueLog,
    });
  });
}
