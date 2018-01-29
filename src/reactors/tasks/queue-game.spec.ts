import suite, { TestWatcher, withDB } from "../../test-suite";

import queueDownload from "./queue-game";
import { actions } from "../../actions/index";

suite(__filename, s => {
  s.case("queueDownload", async t => {
    const w = new TestWatcher();
    await withDB(w.store, async db => {
      queueDownload(w, db);

      let queuedLaunch = false;
      w.on(actions.queueLaunch, async (store, action) => {
        queuedLaunch = true;
      });

      // TODO: actual tests
      t.false(queuedLaunch);
    });
  });
});
