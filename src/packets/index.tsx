import { IRequest, IResult } from "butlerd";

// actions but not really

export interface Packet<PayloadType> {
  type: string;
  payload: PayloadType;
}

export const packets = wirePackets({
  tick: packet<{ time: number }>(),

  navigate: packet<{
    href: string;
  }>(),

  hello: packet<{
    locationHref: string;
  }>(),

  butlerRequest: packet<{
    request: IRequest<any, any>;
  }>(),

  butlerResult: packet<{
    result: IResult<any>;
  }>(),
});

export interface PacketCreator<PayloadType> {
  (payload: PayloadType): Packet<PayloadType>;
  __payload: PayloadType;
  __type: string;
}

function packet<PayloadType>(): PacketCreator<PayloadType> {
  // N.B: that's a lie, but a useful one.
  return ((type: string) => (payload: PayloadType): Packet<PayloadType> => {
    return {
      type,
      payload,
    };
  }) as any;
}

interface MirrorInput {
  [key: string]: PacketCreator<any>;
}

type MirrorOutput<T> = { [key in keyof T]: T[key] };

function wirePackets<T extends MirrorInput>(input: T): MirrorOutput<T> {
  const res = {} as any;
  for (const k of Object.keys(input)) {
    res[k] = input[k](k);
    res[k].__type = k;
  }
  return res as MirrorOutput<T>;
}
