import { MainState } from "main";
import { OnQuery } from "main/socket-handler";
import { queries } from "common/queries";

import valet from "@itchio/valet";

export function registerQueriesSelfUpdate(_ms: MainState, onQuery: OnQuery) {
  onQuery(queries.selfUpdateCheck, async () => {
    try {
      let res = await (valet as any).selfUpdateCheck();
      console.log(`self-update result: `, res);
    } catch (e) {
      console.log(`self-update error: `, e.stack);
      console.log(`self-update error string: `, e);
    }
  });
}
