import { RequestCreator } from "butlerd";
import { SetupFunc } from "common/butlerd";
import store from "renderer/store";
import { rendererLogger } from "renderer/logger";
import { butlerd } from "renderer/bridge";

if (process.type !== "renderer") {
  throw new Error(`rcall cannot be required from main process`);
}

const logger = rendererLogger.childWithName("rcall");

/**
 * Perform a butlerd call from the renderer process
 */
export async function rcall<Params, Res>(
  rc: RequestCreator<Params, Res>,
  params: {} & Params,
  setup?: SetupFunc
): Promise<Res> {
  return await butlerd.rcall(store, logger, rc, params, setup);
}
