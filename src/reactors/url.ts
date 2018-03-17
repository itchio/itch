import { Watcher } from "./watcher";

import * as urlParser from "url";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "reactors/url" });

import { isItchioURL } from "../util/url";
import { reportIssue } from "../util/crash-reporter";
import urls from "../constants/urls";

import { shell } from "electron";

import { actions } from "../actions";

let onProfileReady: () => void;

export default function(watcher: Watcher) {
  watcher.on(actions.processUrlArguments, async (store, action) => {
    const { args } = action.payload;
    for (const uri of args) {
      if (isItchioURL(uri)) {
        store.dispatch(actions.handleItchioUrl({ uri }));
        break;
      }
    }
  });

  watcher.on(actions.openUrl, async (store, action) => {
    const uri = action.payload.url;
    if (isItchioURL(uri)) {
      store.dispatch(actions.handleItchioUrl({ uri }));
    } else {
      shell.openExternal(uri);
    }
  });

  watcher.on(actions.handleItchioUrl, async (store, action) => {
    const { uri } = action.payload;

    logger.info(`Starting to handle itch.io url ${uri}`);
    const me = store.getState().profile.credentials.me;
    if (!me) {
      logger.info("Waiting for profile to be ready before handling itchio url");
      await new Promise((resolve, reject) => {
        onProfileReady = resolve;
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
        store.dispatch(actions.navigate({ url: `itch://games/${gameId}` }));
        break;
      }
    }
  });

  watcher.on(actions.profileReady, async (store, action) => {
    if (onProfileReady) {
      onProfileReady();
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
