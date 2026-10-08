import { Store } from "common/types";
import { Logger } from "common/logger";

import { promisedModal } from "main/reactors/modals";

import * as messages from "common/butlerd/messages";
import { Game, Action, LaunchTarget } from "common/butlerd/messages";
import { mcall } from "main/butlerd/mcall";
import modals from "main/modals";
import { launchTargetKey } from "common/util/launch-settings";

// TODO: support localized action names

export async function pickManifestAction(
  store: Store,
  logger: Logger,
  manifestActions: Action[],
  caveId: string,
  game: Game
): Promise<number> {
  for (let index = 0; index < manifestActions.length; index++) {
    if (!manifestActions[index].name) {
      throw new Error(`in manifest, action ${index} is missing a name`);
    }
  }

  const targets = await fetchTargets(logger, caveId, manifestActions);

  const response = await promisedModal(
    store,
    modals.pickManifestAction.make({
      wind: "root",
      title: game.title,
      message: "",
      widgetParams: { actions: manifestActions, targets, game },
    })
  );

  if (!response) {
    // as per butlerd spec, negative index means abort launch
    return -1;
  }

  if (response.remember) {
    await rememberLaunchTarget(logger, caveId, manifestActions[response.index]);
  }
  return response.index;
}

// butler only sends the actions when asking us to pick, the host and file
// size the picker shows live on the full targets. Launch.GetTargets doesn't
// take the run lock the launch is holding. the picker works without them.
async function fetchTargets(
  logger: Logger,
  caveId: string,
  manifestActions: Action[]
): Promise<(LaunchTarget | null)[]> {
  let targets: LaunchTarget[] = [];
  try {
    const res = await mcall(messages.LaunchGetTargets, { caveId });
    targets = res.targets ?? [];
  } catch (e) {
    logger.warn(`could not fetch launch targets for picker: ${e}`);
  }
  return manifestActions.map(
    (action) =>
      targets.find(
        (t) => t.action.name === action.name && t.action.path === action.path
      ) ?? null
  );
}

// a failed save shouldn't stop the launch
async function rememberLaunchTarget(
  logger: Logger,
  caveId: string,
  action: Action
) {
  if (!action.path) {
    logger.warn(`not remembering launch target '${action.name}': no path`);
    return;
  }
  const launchTarget = launchTargetKey(action);
  try {
    const { settings } = await mcall(messages.CavesGetSettings, { caveId });
    await mcall(messages.CavesSetSettings, {
      caveId,
      settings: { ...settings, launchTarget },
    });
    logger.info(`remembered launch target '${launchTarget}'`);
  } catch (e) {
    logger.warn(`could not remember launch target: ${e}`);
  }
}
