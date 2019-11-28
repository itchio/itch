import { Request, RpcResult } from "butlerd";
import { Profile } from "common/butlerd/messages";
import { OngoingLaunch } from "common/launches";
import { CurrentLocale } from "common/locales";
import { QueryRequest, QueryResult } from "common/queries";

// actions but not really

export interface Packet<PayloadType> {
  type: string;
  payload: PayloadType;
}

export const packets = wirePackets({
  navigate: packet<{
    // URL to open in in-app browser
    url: string;
  }>(),

  // global events
  profileChanged: packet<{ profile: Profile }>(),
  currentLocaleChanged: packet<{ currentLocale: CurrentLocale }>(),
  launchChanged: packet<{ launchId: string; launch: OngoingLaunch }>(),
  launchEnded: packet<{ launchId: string }>(),

  // queries
  qreq: packet<QueryRequest<any>>(),
  qres: packet<QueryResult<any>>(),

  // butlerd requests
  breq: packet<Request<any, any>>(),
  bres: packet<RpcResult<any>>(),
});

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
