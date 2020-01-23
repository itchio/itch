import { Notification, Request, RpcResult } from "butlerd";
import {
  Cave,
  Download,
  NetworkStatus,
  Profile,
} from "common/butlerd/messages";
import { OngoingLaunch } from "common/launches";
import { CurrentLocale } from "common/locales";
import { QueryRequest, QueryResult } from "common/queries";
import { PreferencesState } from "common/preferences";

export interface Packet<PayloadType> {
  type: string;
  payload: PayloadType;
}

/**
 * Packets can be sent between the main process and renderer processes,
 * usually one-on-one, but main can send separate copies of the same packet
 * to all renderers.
 *
 * They generally correspond to events.
 */
export const packets = wirePackets({
  navigate: packet<{
    // URL to open in in-app browser
    url: string;
  }>(),

  // global events
  profileChanged: packet<{ profile?: Profile }>(),
  currentLocaleChanged: packet<{ currentLocale: CurrentLocale }>(),
  launchChanged: packet<{ launchId: string; launch: OngoingLaunch }>(),
  launchEnded: packet<{ launchId: string }>(),
  maximizedChanged: packet<{ maximized: boolean }>(),
  preferencesUpdated: packet<{ preferences: Partial<PreferencesState> }>(),

  // download events
  downloadStarted: packet<{ download: Download }>(),
  downloadChanged: packet<{ download: Download }>(),
  downloadCleared: packet<{ download: Download }>(),
  networkStatusChanged: packet<{ status: NetworkStatus }>(),

  // install events
  gameInstalled: packet<{ cave: Cave }>(),
  gameUninstalled: packet<{
    caveId: string;
    gameId: number;
    uploadId: number;
  }>(),

  // queries
  queryRequest: packet<QueryRequest<any>>(),
  queryResult: packet<QueryResult<any>>(),

  // butlerd requests
  butlerCancel: packet<{ conv: string }>(),
  butlerRequest: packet<{
    conv: string;
    req: Request<any, any>;
    handled?: ButlerHandled;
  }>(),
  butlerResult: packet<{ conv: string; res: RpcResult<any> }>(),
  butlerNotification: packet<{ conv: string; notif: Notification<any> }>(),
});

export type ButlerHandled = {
  notifications?: string[];
  requests?: string[];
};

export interface PacketCreator<PayloadType> {
  (payload: PayloadType): Packet<PayloadType>;
  __payload: PayloadType;
  __type: string;
}

function packet<PayloadType>(): PacketCreator<PayloadType> {
  // that's a lie, we're tricking the type system
  return null as any;
}

interface MirrorInput {
  [key: string]: PacketCreator<any>;
}

type MirrorOutput<T> = { [key in keyof T]: T[key] };

function wirePackets<T extends MirrorInput>(input: T): MirrorOutput<T> {
  const res = {} as any;
  for (const type of Object.keys(input)) {
    res[type] = (payload: any) => ({
      payload,
      type,
    });
    res[type].__type = type;
  }
  return res as MirrorOutput<T>;
}
