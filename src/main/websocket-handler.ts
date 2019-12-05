import {
  Client,
  IDGenerator,
  RequestError,
  RpcResult,
  Conversation,
  RequestCreator,
  NotificationCreator,
  Request,
  RpcError,
} from "butlerd";
import { Packet, PacketCreator, packets } from "common/packets";
import { queries, QueryCreator } from "common/queries";
import dump from "common/util/dump";
import { shell } from "electron";
import { broadcastPacket, MainState } from "main";
import { setCookie } from "main/cookie";
import { registerItchProtocol } from "main/itch-protocol";
import { loadLocale, setPreferences } from "main/load-preferences";
import { registerQueriesLaunch } from "main/queries-launch";
import WebSocket from "ws";
import { partitionForUser } from "common/util/partitions";
import { mainLogger } from "main/logger";
import { startDrivingDownloads } from "main/drive-downloads";
import { setProfile } from "main/profile";

const logger = mainLogger.childWithName("websocket-handler");

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

type Inbound = {
  resolve: (payload: any) => void;
  reject: (e: RpcError) => void;
};

type OngoingConversation = {
  conv: Conversation;
  idSeed: number;
  inbound: { [id: number]: Inbound };
};

export class WebsocketHandler {
  packetHandlers: {
    [type: string]: PacketHandler<any>;
  } = {};

  queryHandlers: {
    [method: string]: QueryHandler<any, any>;
  } = {};

  ongoingConversations: {
    [id: string]: OngoingConversation;
  } = {};

  constructor(mainState: MainState) {
    let onPacket: OnPacket = (pc, f) => {
      this.packetHandlers[pc.__type] = f;
    };

    let onQuery: OnQuery = (qc, f) => {
      this.queryHandlers[qc.__method] = f;
    };

    onQuery(queries.minimize, async () => {
      let win = mainState.browserWindow;
      if (win) {
        win.minimize();
      }
    });

    onQuery(queries.toggleMaximized, async () => {
      let win = mainState.browserWindow;
      if (win) {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      }
    });

    onQuery(queries.close, async () => {
      let win = mainState.browserWindow;
      if (win) {
        win.close();
      }
    });

    onQuery(queries.isMaximized, async () => {
      let maximized = false;
      let win = mainState.browserWindow;
      if (win) {
        maximized = win.isMaximized();
      }
      return { maximized };
    });

    onQuery(queries.getProfile, async () => {
      return { profile: mainState.profile };
    });
    onQuery(queries.setProfile, async params => {
      await setProfile(mainState, params);
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

    onPacket(packets.queryRequest, (cx, req) => {
      let handler = this.queryHandlers[req.method];
      if (!handler) {
        console.warn(`Unhandled query: ${dump(req)}`);
        cx.reply(packets.queryResult, {
          state: "error",
          id: req.id,
          error: new Error(`Unhandled query ${req.method}`),
        });
        return;
      }

      handler(req.params)
        .then(result => {
          cx.reply(packets.queryResult, {
            state: "success",
            id: req.id,
            result,
          });
        })
        .catch(error => {
          cx.reply(packets.queryResult, {
            state: "error",
            id: req.id,
            error,
          });
        });
    });

    onPacket(packets.butlerCancel, (cx, request) => {
      this.cancelConversation(request.conv);
    });

    onPacket(packets.butlerResult, (cx, payload) => {
      let ongoing = this.ongoingConversations[payload.conv];
      if (!ongoing) {
        logger.warn(
          `Got butler result for unknown conversation ${payload.conv}`
        );
        return;
      }

      if (typeof payload.res.id !== "number") {
        // drop notifications
        return;
      }

      let inbound = ongoing.inbound[payload.res.id];
      if (!inbound) {
        logger.warn(`Got butler result for unknown inbound ${payload.res.id}`);
        return;
      }
      delete ongoing.inbound[payload.res.id];

      if (payload.res.error) {
        inbound.reject(payload.res.error);
      } else {
        console.log(
          `Resolving inbound with payload.res.result, payload being: ${dump(
            payload
          )}`
        );
        inbound.resolve(payload.res.result);
      }
    });

    onPacket(packets.butlerRequest, (cx, payload) => {
      if (!mainState.butler) {
        let result: RpcResult<any> = {
          jsonrpc: "2.0",
          id: payload.req.id,
          error: {
            code: -32603,
            message: "butler is offline",
          },
        };
        cx.reply(packets.butlerResult, {
          conv: payload.conv,
          res: result,
        });
        return;
      }

      const req = payload.req;
      const rc = Object.assign(
        (params: any) => (gen: IDGenerator) => ({
          ...req,
          id: gen.generateID(),
        }),
        { __method: req.method }
      );

      let ongoing = this.ongoingConversations[payload.conv];
      let call: Promise<any>;

      if (ongoing) {
        call = ongoing.conv.call(rc, req.params);
      } else {
        let client = new Client(mainState.butler.endpoint);
        call = client.call(rc, req.params, conv => {
          ongoing = { conv, inbound: {}, idSeed: 1 };
          this.ongoingConversations[payload.conv] = ongoing;
          if (payload.handled) {
            if (payload.handled.notifications) {
              for (const method of payload.handled.notifications) {
                let nc = { __method: method } as NotificationCreator<any>;
                conv.onNotification(nc, notif => {
                  cx.reply(packets.butlerNotification, {
                    conv: payload.conv,
                    notif,
                  });
                });
              }
            }

            if (payload.handled.requests) {
              for (const method of payload.handled.requests) {
                let rc = { __method: method } as RequestCreator<any, any>;
                conv.onRequest(rc, async params => {
                  let id = ongoing.idSeed;
                  ongoing.idSeed++;

                  let req: Request<any, any> = {
                    id,
                    method,
                    params,
                  };
                  cx.reply(packets.butlerRequest, {
                    conv: payload.conv,
                    req,
                  });

                  return await new Promise((resolve, reject) => {
                    ongoing.inbound[id] = { resolve, reject };
                  });
                });
              }
            }
          }
        });
      }

      call
        .then(originalResult => {
          let result: RpcResult<any> = {
            jsonrpc: "2.0",
            id: req.id,
            result: originalResult,
          };
          cx.reply(packets.butlerResult, {
            conv: payload.conv,
            res: result,
          });
        })
        .catch((error: RequestError) => {
          let rpcError = error.rpcError || {
            code: -32603,
            message: error.stack || error.message,
          };

          let result: RpcResult<any> = {
            jsonrpc: "2.0",
            id: req.id,
            error: rpcError,
          };
          cx.reply(packets.butlerResult, {
            conv: payload.conv,
            res: result,
          });
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

  private cancelConversation(convID: string) {
    let ongoing = this.ongoingConversations[convID];
    if (!ongoing) {
      return;
    }
    ongoing.conv.cancel();
    delete this.ongoingConversations[convID];
  }
}
