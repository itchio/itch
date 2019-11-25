import { packets, Packet, PacketCreator } from "packets";
import { RequestError, RequestCreator } from "butlerd/lib/support";

type PacketKey = keyof typeof packets;
type Listener<Payload> = (payload: Payload) => void;
export type Cancel = () => void;

export class Socket {
  private ws: WebSocket;
  private listeners: Partial<
    {
      [key in PacketKey]: Listener<any>[];
    }
  >;
  private idSeed: number;
  private outboundRequests: {
    [key: number]: {
      resolve: (payload: any) => void;
      reject: (e: Error) => any;
    };
  };

  static async connect(address: string): Promise<Socket> {
    let socket = new WebSocket(address);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    return new Socket(socket);
  }

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.idSeed = 1;
    this.listeners = {};
    this.outboundRequests = {};
    ws.onmessage = msg => {
      this.process(msg.data as string);
    };
  }

  private process(msg: string) {
    let packet = JSON.parse(msg) as Packet<any>;
    if (packet.type === "butlerResult") {
      let {
        result: response,
      } = packet.payload as typeof packets.butlerResult.__payload;

      if (typeof response.id === "number") {
        let outbound = this.outboundRequests[response.id];
        delete this.outboundRequests[response.id];
        if (response.error) {
          outbound.reject(new RequestError(response.error));
        } else {
          outbound.resolve(response.result);
        }
      }
    }

    let listeners = this.listeners[packet.type];
    if (listeners) {
      for (const l of listeners) {
        l(packet.payload);
      }
    }
  }

  send<T>(pc: PacketCreator<T>, payload: T) {
    if (payload === null) {
      throw new Error(`null payload for ${pc.__type} - that's illegal`);
    }
    this.ws.send(JSON.stringify(pc(payload)));
  }

  listen<T>(packet: PacketCreator<T>, listener: Listener<T>): Cancel {
    let type = packet.__type;
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
    let cancel = () => {
      this.listeners[type] = this.listeners[type].filter(x => x !== listener);
    };
    return cancel;
  }

  generateID(): number {
    let res = this.idSeed;
    this.idSeed++;
    return res;
  }

  async call<T, U>(creator: RequestCreator<T, U>, params: T): Promise<U> {
    let request = creator(params)(this);

    this.send(packets.butlerRequest, { request });

    return new Promise((resolve, reject) => {
      this.outboundRequests[request.id] = { resolve, reject };
    });
  }
}
