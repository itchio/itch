import { IGame } from "../../db/models/game";
import { ICave } from "../../db/models/cave";

import { IStore } from "../../types";

import { Logger } from "../../logger";
import diego from "../../os/diego";

import localizer from "../../localizer";

import * as actions from "../../actions";

type ExtendedError = Error & {
  reason?: string;
};

export default async function notifyCrash(
  store: IStore,
  cave: ICave,
  game: IGame,
  e: ExtendedError,
  logger: Logger,
) {
  logger.error(`crashed with ${e.message}`);
  logger.error(`${e.stack || e}`);
  await diego.hire({ logger });

  const i18n = store.getState().i18n;
  const t = localizer.getT(i18n.strings, i18n.lang);

  let errorMessage = String(e);
  if (e.reason) {
    if (Array.isArray(e.reason)) {
      errorMessage = t.format(e.reason);
    } else {
      errorMessage = String(e.reason);
    }
  }

  store.dispatch(
    actions.openModal({
      title: "",
      message: ["game.install.could_not_launch", { title: game.title }],
      detail: errorMessage,
      buttons: [
        {
          label: ["grid.item.report_problem"],
          icon: "upload-to-cloud",
          action: actions.reportCave({ caveId: cave.id }),
        },
        {
          label: ["grid.item.probe"],
          icon: "bug",
          className: "secondary",
          action: actions.probeCave({ caveId: cave.id }),
        },
        "cancel",
      ],
    }),
  );
}
