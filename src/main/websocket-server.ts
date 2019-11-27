import dump from "common/util/dump";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import { WebsocketContext, WebsocketHandler } from "main/websocket-handler";
import WebSocket from "ws";

let logger = mainLogger.childWithName("ws");

export interface WebSocketState {
  address: string;
  sockets: WebSocket[];
}

export async function startWebsocketServer(mainState: MainState) {
  const wss = new WebSocket.Server({
    host: "localhost",
    port: 0,
    verifyClient: info => {
      let protocol = new URL(info.origin).protocol;
      return protocol == "itch:";
    },
  });
  await new Promise((resolve, reject) => {
    wss.on("listening", resolve);
    wss.on("error", reject);
  });

  let waddr = wss.address() as WebSocket.AddressInfo;
  let state: WebSocketState = {
    address: `ws://${waddr.address}:${waddr.port}`,
    sockets: [],
  };
  mainState.websocket = state;
  logger.info(`Address: ${dump(wss.address())}`);

  let handler = new WebsocketHandler(mainState);

  wss.on("connection", (socket, req) => {
    state.sockets = [...state.sockets, socket];
    let cx = new WebsocketContext(socket);

    socket.on("message", message => handler.handle(cx, message as string));

    socket.on("close", () => {
      // TODO: cancel all outbound butlerd requests
      // TODO: cancel all queries, if at all possible ?
      state.sockets = state.sockets.filter(x => x !== socket);
      logger.warn(`Client going away...`);
    });
  });
}
