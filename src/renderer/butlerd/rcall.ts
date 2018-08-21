import { RequestCreator } from "butlerd";
import { call, SetupFunc } from "common/butlerd";
import store from "renderer/store";

if (process.type !== "renderer") {
  throw new Error(`rcall cannot be required from main process`);
}

/**
 * Perform a butlerd call from the renderer process
 */
export async function rcall<Params, Res>(
  rc: RequestCreator<Params, Res>,
  params: Params,
  setup?: SetupFunc
): Promise<Res> {
  return await call(store, rc, params, setup);
}
