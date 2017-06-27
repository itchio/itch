import defaultManifestIcons from "../../constants/default-manifest-icons";

import * as actions from "../../actions";

import {
  IStore,
  IManifest,
  IManifestAction,
  IModalButtonSpec,
} from "../../types";

import { each } from "underscore";

import { promisedModal } from "../../reactors/modals";
import { MODAL_RESPONSE } from "../../constants/action-types";

export default async function pickManifestAction(
  store: IStore,
  manifest: IManifest,
  game: Game,
): Promise<IManifestAction> {
  const buttons: IModalButtonSpec[] = [];
  const bigButtons: IModalButtonSpec[] = [];

  switch (manifest.actions.length) {
    case 0:
      return null; // empty manifest, okay
    case 1:
      return manifest.actions[0];
    default:
    // keep going then
  }

  let index = 0;
  for (const actionOption of manifest.actions) {
    if (!actionOption.name) {
      throw new Error(`in manifest, action ${i} is missing a name`);
    }
    bigButtons.push({
      label: [
        `action.name.${actionOption.name}`,
        { defaultValue: actionOption.name },
      ],
      action: actions.modalResponse({ manifestActionName: actionOption.name }),
      icon:
        actionOption.icon || defaultManifestIcons[actionOption.name] || "star",
      className: `action-${actionOption.name}`,
    });
    index++;
  }

  buttons.push("cancel");

  const response = await promisedModal(store, {
    title: game.title,
    cover: game.stillCoverUrl || game.coverUrl,
    message: "",
    bigButtons,
    buttons,
  });

  if (response.type === MODAL_RESPONSE) {
    return findWhere(manifest.actions, {
      name: response.payload.manifestActionName,
    });
  }

  return null;
}
