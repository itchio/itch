import { RequestCreator } from "butlerd";
import { SetupFunc } from "common/butlerd/utils";
import store from "renderer/store";
import { rendererLogger } from "renderer/logger";
import { butlerd } from "renderer/bridge";

const logger = rendererLogger.childWithName("rcall");

/**
 * Perform a butlerd call from the renderer process
 */
export async function rcall<Params, Res>(
  rc: RequestCreator<Params, Res>,
  params: {} & Params,
  setup?: SetupFunc
): Promise<Res> {
  return await butlerd.rcall(store, logger, rc.__method, params, setup);
}
