import { modals } from "common/modals";
import { ModalButtonSpec, LocalizedString, Store, Action } from "common/types";
import {
  asRequestError,
  messages,
  mergeLogAndError,
  isInternalError,
} from "common/butlerd";
import { t } from "common/format/t";
import { formatError } from "common/format/errors";
import { Game } from "common/butlerd/messages";
import { promisedModal } from "main/reactors/modals";
import { actions } from "common/actions";

interface InstallErrorParams {
  store: Store;
  e: Error;
  log: string;
  game: Game;
  retryAction: () => Action<any>;
  stopAction: () => Action<any>;
}

export async function showInstallErrorModal(params: InstallErrorParams) {
  let buttons: ModalButtonSpec[] = [];
  let detail: LocalizedString;
  let shouldRetry = true;
  let forceDetails = false;

  const { store, e, log, retryAction, stopAction, game } = params;
  const { i18n } = store.getState();

  if (shouldRetry) {
    buttons = [
      ...buttons,
      {
        label: ["game.install.try_again"],
        icon: "repeat",
        action: retryAction(),
      },
    ];
  }

  buttons = [
    ...buttons,

    {
      label: ["grid.item.discard_download"],
      icon: "delete",
      action: "widgetResponse",
    },
    "cancel",
  ];

  const allowReport = isInternalError(e);

  const typedModal = modals.showError.make({
    wind: "root",
    title: ["prompt.install_error.title"],
    message: t(i18n, formatError(e)),
    detail,
    widgetParams: {
      rawError: e,
      log,
      forceDetails,
      game,
      showSendReport: allowReport,
    },
    buttons,
  });

  const res = await promisedModal(store, typedModal);

  if (res) {
    store.dispatch(stopAction());
    if (allowReport && res.sendReport) {
      store.dispatch(
        actions.sendFeedback({
          log: mergeLogAndError(log, e),
        })
      );
    }
  }
}
