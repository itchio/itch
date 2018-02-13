import defaultManifestIcons from "../../constants/default-manifest-icons";

import { actions } from "../../actions";

import { IStore, IModalButtonSpec } from "../../types";

import { promisedModal } from "../../reactors/modals";

import { Game } from "ts-itchio-api";
import { modalWidgets } from "../../components/modal-widgets/index";
import { ManifestAction } from "node-buse/lib/messages";

// TODO: support localized action names

export async function pickManifestAction(
  store: IStore,
  manifestActions: ManifestAction[],
  game: Game
): Promise<string> {
  const buttons: IModalButtonSpec[] = [];
  const bigButtons: IModalButtonSpec[] = [];

  let index = 0;
  for (const actionOption of manifestActions) {
    if (!actionOption.name) {
      throw new Error(`in manifest, action ${index} is missing a name`);
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

  const response = await promisedModal(
    store,
    modalWidgets.pickManifestAction.make({
      title: game.title,
      stillCoverUrl: game.stillCoverUrl,
      coverUrl: game.coverUrl,
      message: "",
      bigButtons,
      buttons,
      widgetParams: {},
    })
  );

  if (response) {
    return response.manifestActionName;
  }

  return null;
}
