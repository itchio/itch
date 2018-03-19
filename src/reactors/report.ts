import { Watcher } from "../reactors/watcher";
import { actions } from "../actions";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "report" });

import urls from "../constants/urls";

import { reportIssue } from "../util/crash-reporter";
import { createGist, IGistData } from "../api/github";
import * as sf from "../os/sf";
import { caveLogPath } from "../os/paths";
import { withButlerClient, messages } from "../buse";

// TODO: move to itch.io feedback system, see
// https://github.com/itchio/itch/issues/1511

export default function(watcher: Watcher) {
  watcher.on(actions.reportCave, async (store, action) => {
    const { caveId } = action.payload;

    try {
      const { cave } = await withButlerClient(
        logger,
        async client => await client.call(messages.FetchCave({ caveId }))
      );
      const { game } = cave;
      const logPath = caveLogPath(caveId);
      const gameLog = await sf.readFile(logPath, { encoding: "utf8" });

      const gistData = {
        description: `itch log for ${game.title} — ${game.url}`,
        public: false,
        files: {},
      } as IGistData;
      const slug = /\/\/.*\/(.*)$/.exec(game.url)[1];
      gistData.files[`${slug}-log.txt`] = { content: gameLog };
      const gist = await createGist(gistData);

      const body = `:rotating_light: ${game.classification} [${game.title}](${
        game.url
      }) is broken for me.

:book: Here's the complete [debug log](${gist.html_url}).

:running: Any additional details can go here!`;

      reportIssue({
        type: `${game.title} ↔`,
        repo: urls.watchlistRepo,
        body,
      });
    } catch (e) {
      logger.error(`Error reporting cave: ${e.stack || e}`);
    }
  });
}
