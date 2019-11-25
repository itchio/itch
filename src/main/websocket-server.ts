import WebSocket from "ws";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";
import { Packet, packets } from "packets";
import { MainState, broadcastPacket } from "main";
import { Client, IDGenerator, IResult, RequestError } from "butlerd";

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
    let reply = (payload: any) => {
      socket.send(JSON.stringify(payload));
    };

    state.sockets = [...state.sockets, socket];
    socket.on("message", msg => {
      let packet = JSON.parse(msg as string) as Packet<any>;
      logger.warn(`Client message: ${dump(packet)}`);

      switch (packet.type) {
        case "navigate": {
          broadcastPacket(packet);
          break;
        }
        case "butlerRequest": {
          if (mainState.butler) {
            const client = new Client(mainState.butler.endpoint);
            let {
              request,
            } = packet.payload as typeof packets.butlerRequest.__payload;
            client
              .call(
                (params: any) => (gen: IDGenerator) => ({
                  ...request,
                  id: gen.generateID(),
                }),
                request.params
              )
              .then(originalResult => {
                let result: IResult<any> = {
                  id: request.id,
                  result: originalResult,
                };
                reply(
                  packets.butlerResult({
                    result,
                  })
                );
              })
              .catch((error: RequestError) => {
                let result: IResult<any> = {
                  id: request.id,
                  error: error.rpcError,
                };
                reply(
                  packets.butlerResult({
                    result,
                  })
                );
              });
          }
          break;
        }
      }
    });
    socket.on("close", () => {
      // TODO: cancel all outbound butlerd requests

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
}
