import { ModalCreator, ModalPayload } from "common/modals";
import { BrowserWindow, session } from "electron";
import { MainState } from "main";
import { partitionForApp } from "common/util/partitions";
import { shellBgDefault } from "renderer/theme";

export async function showModal<Params, Result>(
  ms: MainState,
  mc: ModalCreator<Params, Result>,
  params: Params
): Promise<Result | undefined> {
  let modal = new BrowserWindow({
    parent: ms.browserWindow,
    title: "Pick cave",
    modal: true,
    width: 500,
    height: 420,
    backgroundColor: shellBgDefault,
    show: false,
    webPreferences: {
      session: session.fromPartition(partitionForApp()),
    },
  });
  modal.setMenu(null);

  let payload: ModalPayload = {
    id: `${modal.id}`,
    kind: mc.__kind,
    params,
  };

  let urlParams = new URLSearchParams();
  urlParams.set("payload", JSON.stringify(payload));
  await modal.loadURL(`itch://modal?${urlParams}`);
  modal.show();

  try {
    return await new Promise((resolve, reject) => {
      modal.addListener("close", () => resolve(undefined));
      ms.modals[modal.id] = { onResult: resolve };
    });
  } finally {
    delete ms.modals[modal.id];
  }
}
