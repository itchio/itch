import { modalWidgets } from "renderer/modal-widgets";
import { ModalButtonSpec, LocalizedString, Store, Action } from "common/types";
import { asRequestError, messages } from "common/butlerd";
import { t } from "common/format/t";
import { formatError } from "common/format/errors";
import { Game } from "common/butlerd/messages";

interface InstallErrorParams {
  store: Store;
  e: Error;
  log: string;
  game: Game;
  retryAction: () => Action<any>;
  stopAction: () => Action<any>;
}

export function makeInstallErrorModal(params: InstallErrorParams) {
  let buttons: ModalButtonSpec[] = [];
  let detail: LocalizedString;
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
    window: "root",
    title: ["prompt.install_error.title"],
    message: t(i18n, formatError(e)),
    detail,
    widgetParams: { rawError: e, log, forceDetails, game },
    buttons,
  });
}
