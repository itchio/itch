import WebSocket from "ws";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";
import { Packet, packets } from "packets";
import { MainState } from "main";

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

  wss.on("connection", (socket, req) => {
    state.sockets = [...state.sockets, socket];
    socket.on("message", msg => {
      logger.warn(`Client message: ${msg}`);
    });
    socket.on("close", () => {
      state.sockets = state.sockets.filter(x => x !== socket);
      logger.warn(`Client going away...`);
    });
  });

  let broadcast = <T>(p: Packet<T>) => {
    let serialized = JSON.stringify(p);
    for (const s of state.sockets) {
      s.send(serialized);
    }
  };

  setInterval(() => {
    broadcast(
      packets.tick({
        time: Date.now(),
      })
    );
  }, 1000);
}
