import store from "main/store";
import { call, SetupFunc } from "common/butlerd";
import { mainLogger } from "main/logger";
import { RequestCreator } from "butlerd";

if (process.type !== "browser") {
  throw new Error(`mcall cannot be required from renderer process`);
}

/**
 * Perform a butlerd call from the main process
 */
export async function mcall<Params, Res>(
  rc: RequestCreator<Params, Res>,
  params: Params,
  setup?: SetupFunc
): Promise<Res> {
  return await call(store, rc, params, setup);
}
