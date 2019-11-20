// actions but not really

interface Packet<PayloadType> {
  type: string;
  payload: PayloadType;
}

export const packets = wirePackets({
  hello: packet<{
    locationHref: string;
  }>(),
  bye: packet<{ time: number }>(),
});

type PacketCreator<PayloadType> = (payload: PayloadType) => Packet<PayloadType>;

function packet<PayloadType>(): PacketCreator<PayloadType> {
  // that's a lie, but it makes typing work
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
  }
  return res as MirrorOutput<T>;
}
