import { MainState } from "main";
import { OnQuery } from "main/socket-handler";
import { queries } from "common/queries";

import valet from "@itchio/valet";
import env from "common/env";
import { join } from "path";
import { app } from "electron";

export function registerQueriesSelfUpdate(_ms: MainState, onQuery: OnQuery) {
  onQuery(queries.selfUpdateCheck, async () => {
    (valet as any).selfUpdateCheck({
      isCanary: env.isCanary,
      componentsDir: join(app.getPath("userData"), "components"),
    });
  });
}
