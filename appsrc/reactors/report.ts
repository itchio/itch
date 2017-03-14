
import {Watcher} from "./watcher";
import * as actions from "../actions";

import mklog from "../util/log";
const log = mklog("reactors/report");
import {opts} from "../logger";

import {getUserMarket} from "./market";

import urls from "../constants/urls";

import crashReporter from "../util/crash-reporter";
import github, {IGistData} from "../util/github";
import sf from "../util/sf";
import fetch from "../util/fetch";
import pathmaker from "../util/pathmaker";

export default function (watcher: Watcher) {
  watcher.on(actions.reportCave, async (store, action) => {
    const {caveId} = action.payload;

    try {
      const state = store.getState();
      const credentials = state.session.credentials;
      const cave = state.globalMarket.caves[caveId];
      const logPath = pathmaker.caveLogPath(caveId);
      const userMarket = getUserMarket();
      const game = await fetch.gameLazily(userMarket, credentials, cave.gameId, {game: cave.game});

      const gameLog = await sf.readFile(logPath, {encoding: "utf8"});

      const gistData = {
        description: `itch log for ${game.title} — ${game.url}`,
        public: false,
        files: {},
      } as IGistData;
      const slug = /\/\/.*\/(.*)$/.exec(game.url)[1];
      gistData.files[`${slug}-log.txt`] = {content: gameLog};
      const gist = await github.createGist(gistData);

      const body =
  `:rotating_light: ${game.classification} [${game.title}](${game.url}) is broken for me.

:book: Here's the complete [debug log](${gist.html_url}).

:running: Any additional details can go here!`;

      crashReporter.reportIssue({
        type: `${game.title} ↔`,
        repo: urls.watchlistRepo,
        body,
      });
    } catch (e) {
      log(opts, `Error reporting cave: ${e.stack || e}`);
    }
  });
}
