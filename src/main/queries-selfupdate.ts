import { MainState } from "main";
import { OnQuery } from "main/socket-handler";
import { queries } from "common/queries";

import valet from "@itchio/valet";
import env from "common/env";
import { join } from "path";
import { app } from "electron";

export function registerQueriesSelfUpdate(_ms: MainState, onQuery: OnQuery) {
  onQuery(queries.selfUpdateCheck, async () => {
    try {
      let res = await (valet as any).selfUpdateCheck({
        isCanary: env.isCanary,
        componentsDir: join(app.getPath("userData"), "components"),
      });
      console.log(`self-update result: `, res);
    } catch (e) {
      console.log(`self-update error: `, e.stack);
      console.log(`self-update error string: `, e);
    }
  });
}
