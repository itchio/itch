import { modalWidgets } from "renderer/components/modal-widgets";
import {
  IModalButtonSpec,
  ILocalizedString,
  IStore,
  IAction,
} from "common/types";
import { asRequestError, messages } from "common/butlerd";
import { t } from "common/format/t";
import { formatError } from "common/format/errors";
import { Game } from "common/butlerd/messages";

interface InstallErrorParams {
  store: IStore;
  e: Error;
  log: string;
  game: Game;
  retryAction: () => IAction<any>;
  stopAction: () => IAction<any>;
}

export function makeInstallErrorModal(params: InstallErrorParams) {
  let buttons: IModalButtonSpec[] = [];
  let detail: ILocalizedString;
  let shouldRetry = true;
  let forceDetails = false;

  const { store, e, log, retryAction, stopAction, game } = params;
  const { i18n } = store.getState();

  const re = asRequestError(e);

  if (re) {
    switch (re.rpcError.code) {
      case messages.Code.UnsupportedPackaging: {
        const learnMore = t(i18n, ["docs.how_to_help"]);
        detail = `[${learnMore}](https://itch.io/docs/itch/integrating/quickstart.html)`;
        shouldRetry = false;
        forceDetails = true;
        break;
      }
    }
  }

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
      action: stopAction(),
    },
    "cancel",
  ];

  return modalWidgets.showError.make({
    title: ["prompt.install_error.title"],
    message: t(i18n, formatError(e)),
    detail,
    widgetParams: { rawError: e, log, forceDetails, game },
    buttons,
  });
}
