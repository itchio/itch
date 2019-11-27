import { Client, IDGenerator, IResult, RequestError } from "butlerd";
import { messages } from "common/butlerd";
import { Packet, PacketCreator, packets } from "common/packets";
import { queries, QueryCreator } from "common/queries";
import { prereqsPath } from "common/util/paths";
import { broadcastPacket, MainState } from "main";
import WebSocket from "ws";
import { loadLocale, setPreferences } from "main/load-preferences";
import dump from "common/util/dump";

export class WebsocketContext {
  constructor(private socket: WebSocket) {}

  reply<T>(pc: PacketCreator<T>, payload: T) {
    this.socket.send(JSON.stringify(pc(payload)));
  }
}

type PacketHandler<T> = (cx: WebsocketContext, payload: T) => void;
type QueryHandler<Params, Result> = (params: Params) => Promise<Result>;

export class WebsocketHandler {
  packetHandlers: {
    [type: string]: PacketHandler<any>;
  } = {};

  queryHandlers: {
    [method: string]: QueryHandler<any, any>;
  } = {};

  constructor(mainState: MainState) {
    let onPacket = <T>(pc: PacketCreator<T>, f: PacketHandler<T>) => {
      this.packetHandlers[pc.__type] = f;
    };

    let onQuery = <Params, Result>(
      qc: QueryCreator<Params, Result>,
      f: QueryHandler<Params, Result>
    ) => {
      this.queryHandlers[qc.__method] = f;
    };

    onQuery(queries.getProfile, async () => {
      return { profile: mainState.profile };
    });
    onQuery(queries.setProfile, async params => {
      const { profile } = params;
      mainState.profile = profile;
      broadcastPacket(packets.profileChanged, { profile });
    });

    onQuery(queries.getWebviewState, async () => {
      return { state: mainState.webview };
    });
    onQuery(queries.setWebviewState, async params => {
      mainState.webview = params.state;
    });

    onQuery(queries.getCurrentLocale, async params => {
      return {
        currentLocale: mainState.localeState!.current,
      };
    });
    onQuery(queries.switchLanguage, async params => {
      const { lang } = params;
      await loadLocale(mainState, lang);
      broadcastPacket(packets.currentLocaleChanged, {
        currentLocale: mainState.localeState!.current,
      });
      await setPreferences(mainState, { lang });
    });

    onQuery(queries.launchGame, async ({ gameId }) => {
      let client = new Client(mainState.butler!.endpoint);
      const { items } = await client.call(messages.FetchCaves, {
        filters: { gameId },
      });
      if (!items || items.length == 0) {
        console.warn(`No caves, can't launch game`);
      }
      if (items.length > 1) {
        // FIXME: handle multiple caves
        throw new Error(`multiple caves present, not sure what to do`);
      }

      const cave = items[0];
      await client.call(messages.Launch, {
        caveId: cave.id,
        prereqsDir: prereqsPath(),
        // TODO: sandbox preferences
      });
    });

    onPacket(packets.qreq, (cx, req) => {
      let handler = this.queryHandlers[req.method];
      if (!handler) {
        console.warn(`Unhandled query: ${dump(req)}`);
        cx.reply(packets.qres, {
          state: "error",
          id: req.id,
          error: new Error(`Unhandled query ${req.method}`),
        });
        return;
      }

      handler(req.params)
        .then(result => {
          cx.reply(packets.qres, {
            state: "success",
            id: req.id,
            result,
          });
        })
        .catch(error => {
          cx.reply(packets.qres, {
            state: "error",
            id: req.id,
            error,
          });
        });
    });

    onPacket(packets.breq, (cx, request) => {
      if (!mainState.butler) {
        let result: IResult<any> = {
          id: request.id,
          error: {
            code: 999,
            message: "butler is offline",
          },
        };
        cx.reply(packets.bres, result);
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
          cx.reply(packets.bres, result);
        })
        .catch((error: RequestError) => {
          let result: IResult<any> = {
            id: request.id,
            error: error.rpcError,
          };
          cx.reply(packets.bres, result);
        });
    });
  }

  handle(cx: WebsocketContext, message: string) {
    let msg = JSON.parse(message) as Packet<any>;
    let ph = this.packetHandlers[msg.type];
    if (!ph) {
      console.warn(`Unhandled renderer packet: [[${msg}]]`);
      return;
    }
    ph(cx, msg.payload);
  }
}
