import * as actions from "../../actions";
import { MODAL_RESPONSE } from "../../constants/action-types";

import { promisedModal } from "../../reactors/modals";
import { Cancelled } from "../../types";

import { ICoreOpts } from "./core";

export default async function getBlessing(
  opts: ICoreOpts,
  operation: "install" | "uninstall",
) {
  const { ctx, game } = opts;
  const { store } = ctx;
  const { title } = game;

  const response = await promisedModal(store, {
    title: "",
    // FIXME: i18n
    message: `Administrator privileges are required to ${operation} ${title}.`,
    detail: "Only accept if you trust this content.",
    buttons: [
      {
        label: ["prompt.action.continue"],
        id: "modal-clear-data",
        action: actions.modalResponse({}),
      },
      "cancel",
    ],
  });

  if (response.type !== MODAL_RESPONSE) {
    // modal was closed
    throw new Cancelled("blessing not given");
  }
}
