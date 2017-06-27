import suite, { TestWatcher, loadDB } from "../../test-suite";
import Context from "../../context";
import { DB } from "../../db";

import downloadPatches from "./download-patches";
import butler from "../../util/butler";

import { IDownloadItem, IGameCredentials } from "../../types";
import { devNull } from "../../logger";

suite(__filename, s => {
  s.case("downloads patches", async t => {
    const db = new DB();
    const w = new TestWatcher();
    await loadDB(db, w.store);
    const ctx = new Context(w.store, db);

    const credentials: IGameCredentials = {
      apiKey: "api-key",
    };

    t.stub(butler, "apply").throws();
    const item = {
      upload: {
        id: 12,
      },
      game: {
        id: 34,
      },
    } as IDownloadItem;

    // should refuse because we have no cave
    await t.rejects(
      downloadPatches({
        ctx,
        credentials,
        item,
        logger: devNull,
      }),
    );
  });
});
