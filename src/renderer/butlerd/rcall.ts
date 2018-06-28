import store from "renderer/store";
import { call, SetupFunc } from "common/butlerd";
import { IRequestCreator } from "butlerd";
import { rendererLogger } from "renderer/logger";

if (process.type !== "renderer") {
  throw new Error(`rcall cannot be required from main process`);
}

/**
 * Perform a butlerd call from the renderer process
 */
export async function rcall<Params, Res>(
  rc: IRequestCreator<Params, Res>,
  params: Params,
  setup?: SetupFunc
): Promise<Res> {
  const rs = store.getState();
  return await call(rs, rendererLogger, rc, params, setup);
}
