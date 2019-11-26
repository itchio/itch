import WebSocket from "ws";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";
import { Packet, packets, PacketCreator } from "common/packets";
import { MainState, broadcastPacket } from "main";
import { Client, IDGenerator, IResult, RequestError } from "butlerd";
import { messages } from "common/butlerd";
import { prereqsPath } from "common/util/paths";

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

    let handlers: {
      [key: string]: (t: any, p: Packet<any>) => void;
    } = {};

    let on = <T>(pc: PacketCreator<T>, f: (t: T, p: Packet<T>) => void) => {
      handlers[pc.__type] = f;
    };

    on(packets.navigate, (payload, packet) => {
      broadcastPacket(packet);
    });

    on(packets.setProfile, (payload, packet) => {
      broadcastPacket(packet);
      mainState.profile = payload.profile;
    });
    on(packets.getProfile, () => {
      const { profile } = mainState;
      reply(packets.getProfileResult({ profile }));
    });

    on(packets.setWebviewHistory, payload => {
      mainState.webviewHistory = payload.webviewHistory;
    });
    on(packets.getWebviewHistory, () => {
      const { webviewHistory } = mainState;
      reply(packets.getWebviewHistoryResult({ webviewHistory }));
    });

    on(packets.launchGame, ({ gameId }) => {
      (async () => {
        let client = new Client(mainState.butler!.endpoint);
        const { items } = await client.call(messages.FetchCaves, {
          filters: { gameId },
        });
        if (!items || items.length == 0) {
          console.warn(`No caves, can't launch game`);
        }
        // FIXME: multiple caves
        const cave = items[0];
        await client.call(messages.Launch, {
          caveId: cave.id,
          prereqsDir: prereqsPath(),
          // TODO: sandbox preferences
        });
      })();
    });

    on(packets.butlerRequest, payload => {
      let { request } = payload;

      if (!mainState.butler) {
        let result: IResult<any> = {
          id: request.id,
          error: {
            code: 999,
            message: "butler is offline",
          },
        };
        reply(
          packets.butlerResult({
            result,
          })
        );
        return;
      }

      const client = new Client(mainState.butler.endpoint);
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
    });

    socket.on("message", msg => {
      let packet = JSON.parse(msg as string) as Packet<any>;

      let handler = handlers[packet.type];
      if (handler) {
        logger.info(`Client message: ${dump(packet)}`);
        handler(packet.payload, packet);
      } else {
        logger.warn(`Unhandled client message: ${dump(packet)}`);
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
