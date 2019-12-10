import dump from "common/util/dump";
import { uuid } from "common/util/uuid";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import {
  WebsocketContext as WebSocketContext,
  WebsocketHandler,
} from "main/websocket-handler";
import WebSocket from "ws";
import * as http from "http";

let logger = mainLogger.childWithName("ws");

export interface WebSocketState {
  address: string;
  secret: string;
  sockets: WebSocketContext[];
}

export async function startWebSocketServer(ms: MainState) {
  const wss = new WebSocket.Server({
    host: "localhost",
    port: 0,
    verifyClient: (info: {
      origin: string;
      req: http.IncomingMessage;
    }): boolean => {
      if (!ms.websocket) {
        logger.warn(
          `WebSocket connection before websocket state was set, dropping`
        );
        return false;
      }

      let protocol = new URL(info.origin).protocol;
      if (protocol != "itch:") {
        logger.warn(`WebSocket connection from non-itch origin, dropping`);
        return false;
      }

      // n.b: `info.req.url` is something like `/?secret=XXX`
      let url = new URL(`http://example.org${info.req.url || "/"}`);
      let secret = url.searchParams.get("secret");
      if (!secret) {
        logger.warn(`WebSocket connection with missing secret, dropping`);
        return false;
      }

      if (secret != ms.websocket.secret) {
        logger.warn(`WebSocket connection with invalid secret, dropping`);
        return false;
      }

      return true;
    },
  });
  await new Promise((resolve, reject) => {
    wss.on("listening", resolve);
    wss.on("error", reject);
  });

  let waddr = wss.address() as WebSocket.AddressInfo;
  let secret = uuid();
  let waddrParams = new URLSearchParams();
  waddrParams.set("secret", secret);
  let state: WebSocketState = {
    address: `ws://${waddr.address}:${waddr.port}?${waddrParams}`,
    secret,
    sockets: [],
  };
  ms.websocket = state;
  logger.debug(`WebSocket address: ${dump(wss.address())}`);

  let handler = new WebsocketHandler(ms);

  wss.on("connection", (socket, req) => {
    let cx = new WebSocketContext(socket);
    state.sockets = [...state.sockets, cx];

    socket.on("message", message => handler.handle(cx, message as string));

    socket.on("close", () => {
      // TODO: cancel all outbound butlerd requests
      // TODO: cancel all queries, if at all possible ?
      state.sockets = state.sockets.filter(x => x !== cx);
      logger.debug(`Client going away...`);
    });
  });
}
