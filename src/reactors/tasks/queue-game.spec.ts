import suite, { TestWatcher, actions, loadDB } from "../../test-suite";
import { DB } from "../../db";

import queueDownload from "./queue-game";

const db = new DB();

suite(__filename, s => {
  s.case("queueDownload", async t => {
    const w = new TestWatcher();
    await loadDB(db, w.store);
    queueDownload(w, db);

    let queuedLaunch = false;
    w.on(actions.queueLaunch, async (store, action) => {
      queuedLaunch = true;
    });
  });
});
