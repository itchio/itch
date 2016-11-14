
import * as urlParser from "url";

import mklog from "../util/log";
const log = mklog("reactors/url");
import {opts} from "../logger";

import {isItchioURL} from "../util/url";
import crashReporter from "../util/crash-reporter";
import urls from "../constants/urls";

import {shell} from "../electron";

import * as actions from "../actions";

import {IStore} from "../types";
import {
  IAction,
  ISessionReadyPayload,
  IHandleItchioUrlPayload,
  IOpenUrlPayload,
  IViewCreatorProfilePayload,
  IViewCommunityProfilePayload,
  IReportIssuePayload,
} from "../constants/action-types";

let onSessionReady: () => void;

async function sessionReady (store: IStore, action: IAction<ISessionReadyPayload>) {
  if (onSessionReady) {
    onSessionReady();
  }
}

async function handleItchioUrl (store: IStore, action: IAction<IHandleItchioUrlPayload>) {
  const {uri} = action.payload;

  log(opts, `Starting to handle itch.io url ${uri}`);
  const key = store.getState().session.credentials.key;
  if (!key) {
    log(opts, "Waiting for session to be ready before handling itchio url");
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
        log(opts, "for install: missing game, bailing out.");
        return;
      }
      const gameId = tokens[1];
      store.dispatch(actions.navigate("games/" + gameId));
      break;
    }

    default: {
      const resourcePath = url.hostname + url.pathname;
      log(opts, `Opening resource directly: ${resourcePath}`);
      store.dispatch(actions.navigate(resourcePath));
    }
  }
}

async function openUrl (store: IStore, action: IAction<IOpenUrlPayload>) {
  const uri = action.payload.url;
  if (isItchioURL(uri)) {
    store.dispatch(actions.handleItchioUrl({uri}));
  } else {
    shell.openExternal(uri);
  }
}

async function viewCreatorProfile (store: IStore, action: IAction<IViewCreatorProfilePayload>) {
  const url = store.getState().session.credentials.me.url;
  store.dispatch(actions.navigate("url/" + url));
}

async function viewCommunityProfile (store: IStore, action: IAction<IViewCommunityProfilePayload>) {
  const url = store.getState().session.credentials.me.url;
  const host = urlParser.parse(url).hostname;
  const slug = /^[^.]+/.exec(host);
  store.dispatch(actions.navigate("url/" + `${urls.itchio}/profile/${slug}`));
}

async function reportIssue (store: IStore, action: IAction<IReportIssuePayload>) {
  // TODO: that's dirty, just make sure every time we call reportIssue, we have
  // a non-null payload
  const {log: issueLog} = action.payload || {log: null};

  crashReporter.reportIssue({
    body: "Dear itch app team, ",
    log: issueLog,
  });
}

export default {openUrl, handleItchioUrl, sessionReady, viewCreatorProfile,
  viewCommunityProfile, reportIssue};
