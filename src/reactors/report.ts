
import {Watcher} from "../reactors/watcher";
import * as actions from "../actions";

import rootLogger from "../logger";
const logger = rootLogger.child("report");

import Cave from "../db/models/cave";

import urls from "../constants/urls";

import crashReporter from "../util/crash-reporter";
import github, {IGistData} from "../api/github";
import sf from "../os/sf";
import {caveLogPath} from "../os/paths";
import fetch from "../util/fetch";

export default function (watcher: Watcher) {
  watcher.on(actions.reportCave, async (store, action) => {
    const {caveId} = action.payload;

    try {
      const state = store.getState();
      const credentials = state.session.credentials;
      const {globalMarket, market} = watcher.getMarkets();
      const cave = await globalMarket.getRepo(Cave).findOneById(caveId);

      const logPath = caveLogPath(caveId);
      const game = await fetch.gameLazily(market, credentials, cave.gameId);

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
      logger.error(`Error reporting cave: ${e.stack || e}`);
    }
  });
}
