import { IRequest, IResult } from "butlerd";
import { Profile } from "common/butlerd/messages";
import { WebviewState } from "main";
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

  // queries
  qreq: packet<QueryRequest<any>>(),
  qres: packet<QueryResult<any>>(),

  // butlerd requests
  breq: packet<IRequest<any, any>>(),
  bres: packet<IResult<any>>(),
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
