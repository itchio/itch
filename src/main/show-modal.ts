import { ModalCreator, ModalPayload } from "common/modals";
import {
  BrowserWindow,
  session,
  BrowserWindowConstructorOptions,
} from "electron";
import { MainState } from "main";
import { partitionForApp } from "common/util/partitions";
import { shellBgDefault } from "renderer/theme";
import {
  setupCustomShortcuts,
  openOrFocusDevTools,
} from "main/setup-shortcuts";
import _ from "lodash";
import { mainLogger } from "main/logger";

const logger = mainLogger.childWithName("show-modal");

export async function showModal<Params, Result>(
  ms: MainState,
  mc: ModalCreator<Params, Result>,
  params: Params
): Promise<Result | undefined> {
  let customOpts = mc.__customOptions;
  let kind = mc.__kind;
  let existing = _.find(ms.modals, m => m.mc.__kind == kind);
  if (customOpts.singleton && existing) {
    logger.info(`Modal kind ${kind} is singleton, focusing existing one`);
    existing.browserWindow.show();
    return;
  }

  let opts: BrowserWindowConstructorOptions = {
    parent: customOpts.detached ? undefined : ms.browserWindow,
    width: customOpts.dimensions?.width ?? 500,
    height: customOpts.dimensions?.height ?? 420,
    backgroundColor: shellBgDefault,
    useContentSize: true,
    frame: false,
    show: false,
    webPreferences: {
      session: session.fromPartition(partitionForApp()),
    },
  };
  let modal = new BrowserWindow(opts);
  modal.setMenu(null);

  setupCustomShortcuts(ms, modal.webContents, [
    [["CmdOrCtrl+Shift+C"], async ms => openOrFocusDevTools(modal.webContents)],
  ]);

  let payload: ModalPayload = {
    id: `${modal.id}`,
    kind: mc.__kind,
    params,
  };

  let urlParams = new URLSearchParams();
  urlParams.set("payload", JSON.stringify(payload));
  modal.loadURL(`itch://modal?${urlParams}`);
  // modal.once("ready-to-show", () => {
  //   modal.show();
  // });

  try {
    return await new Promise((resolve, reject) => {
      modal.addListener("close", () => resolve(undefined));
      ms.modals[modal.id] = { onResult: resolve, mc, browserWindow: modal };
    });
  } finally {
    delete ms.modals[modal.id];
  }
}
