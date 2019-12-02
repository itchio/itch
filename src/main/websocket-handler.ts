import { Client, IDGenerator, RequestError, RpcResult } from "butlerd";
import { Packet, PacketCreator, packets } from "common/packets";
import { queries, QueryCreator } from "common/queries";
import dump from "common/util/dump";
import { broadcastPacket, MainState } from "main";
import { loadLocale, setPreferences } from "main/load-preferences";
import { registerQueriesLaunch } from "main/queries-launch";
import WebSocket from "ws";
import { shell } from "electron";

export class WebsocketContext {
  constructor(private socket: WebSocket) {}

  reply<T>(pc: PacketCreator<T>, payload: T) {
    this.socket.send(JSON.stringify(pc(payload)));
  }
}

export type PacketHandler<T> = (cx: WebsocketContext, payload: T) => void;
export type QueryHandler<Params, Result> = (params: Params) => Promise<Result>;

export type OnPacket = <T>(pc: PacketCreator<T>, f: PacketHandler<T>) => void;
export type OnQuery = <Params, Result>(
  qc: QueryCreator<Params, Result>,
  f: QueryHandler<Params, Result>
) => void;

export class WebsocketHandler {
  packetHandlers: {
    [type: string]: PacketHandler<any>;
  } = {};

  queryHandlers: {
    [method: string]: QueryHandler<any, any>;
  } = {};

  constructor(mainState: MainState) {
    let onPacket: OnPacket = (pc, f) => {
      this.packetHandlers[pc.__type] = f;
    };

    let onQuery: OnQuery = (qc, f) => {
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

    onQuery(queries.openExternalURL, async ({ url }) => {
      shell.openExternal(url);
    });

    registerQueriesLaunch(mainState, onQuery);

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
        let result: RpcResult<any> = {
          jsonrpc: "2.0",
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
      const rc = Object.assign(
        (params: any) => (gen: IDGenerator) => ({
          ...request,
          id: gen.generateID(),
        }),
        { __method: request.method }
      );
      client
        .call(rc, request.params)
        .then(originalResult => {
          let result: RpcResult<any> = {
            jsonrpc: "2.0",
            id: request.id,
            result: originalResult,
          };
          cx.reply(packets.bres, result);
        })
        .catch((error: RequestError) => {
          let result: RpcResult<any> = {
            jsonrpc: "2.0",
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
