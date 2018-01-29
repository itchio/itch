import { ICave } from "../../db/models/cave";

import { IStore, isCancelled } from "../../types";

import { Logger } from "../../logger";
import diego from "../../os/diego";

import { t } from "../../format";

import { actions } from "../../actions";
import { Game } from "ts-itchio-api";

type ExtendedError = Error & {
  reason?: string;
};

export default async function notifyCrash(
  store: IStore,
  cave: ICave,
  game: Game,
  e: ExtendedError,
  logger: Logger
) {
  if (isCancelled(e)) {
    // well, don't notify that.
    return;
  }

  logger.error(`Crashed with ${e.message}`);
  logger.error(`${e.stack || e}`);
  await diego.hire({ logger });

  const i18n = store.getState().i18n;

  let errorMessage = String(e);
  if (e.reason) {
    if (Array.isArray(e.reason)) {
      errorMessage = t(i18n, e.reason);
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
    })
  );
}
