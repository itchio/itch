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

export async function showModal<Params, Result>(
  ms: MainState,
  mc: ModalCreator<Params, Result>,
  params: Params
): Promise<Result | undefined> {
  let opts: BrowserWindowConstructorOptions = {
    parent: ms.browserWindow,
    width: 500,
    height: 420,
    backgroundColor: shellBgDefault,
    useContentSize: true,
    frame: false,
    show: false,
    webPreferences: {
      session: session.fromPartition(partitionForApp()),
    },
  };
  if (mc.__customOptions.dimensions) {
    opts.width = mc.__customOptions.dimensions.width;
    opts.height = mc.__customOptions.dimensions.height;
  }
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
  modal.once("ready-to-show", () => {
    modal.show();
  });

  try {
    return await new Promise((resolve, reject) => {
      modal.addListener("close", () => resolve(undefined));
      ms.modals[modal.id] = { onResult: resolve };
    });
  } finally {
    delete ms.modals[modal.id];
  }
}
