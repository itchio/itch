import { MainState } from "main";
import { mainLogger } from "main/logger";
import { SocketContext, SocketHandler } from "main/socket-handler";
import { ipcMain } from "electron";

let logger = mainLogger.childWithName("ws");

export interface SocketState {
  sockets: {
    [webContentsId: number]: SocketContext;
  };
}

export async function startSocketServer(ms: MainState) {
  let state: SocketState = { sockets: {} };
  ms.socket = state;

  let handler = new SocketHandler(ms);

  ipcMain.on("from-renderer", (ev, payload: string) => {
    let wcId = ev.sender.id;
    let cx = state.sockets[wcId];
    if (!cx) {
      cx = new SocketContext(wcId);
      logger.debug(`Client joined (wcId ${wcId})`);
      state.sockets[wcId] = cx;
      ev.sender.on("destroyed", () => {
        // TODO: cancel all outbound butlerd requests
        // TODO: cancel all queries, if at all possible ?
        delete state.sockets[wcId];
        logger.debug(`Client going away... (wcId ${wcId})`);
      });
    }
    handler.handle(cx, payload);
  });
}
