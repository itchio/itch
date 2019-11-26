import { packets, Packet, PacketCreator } from "common/packets";
import { RequestError, RequestCreator } from "butlerd/lib/support";
import { QueryCreator, QueryRequest } from "common/queries";

type PacketKey = keyof typeof packets;
type Listener<Payload> = (payload: Payload) => void;
export type Cancel = () => void;

interface Outbound<Result> {
  resolve: (result: Result) => void;
  reject: (error: Error) => void;
}

const TYPES_THAT_ARE_FORBIDDEN_TO_LISTEN = (() => {
  let map = [];
  for (const pc of [packets.breq, packets.bres, packets.qreq, packets.qres]) {
    map[pc.__type] = true;
  }
})();

export class Socket {
  private ws: WebSocket;
  private listeners: Partial<
    {
      [key in PacketKey]: Listener<any>[];
    }
  > = {};
  private idSeed = 1;
  private outboundCalls: { [key: number]: Outbound<any> } = {};
  private outboundQueries: { [key: number]: Outbound<any> } = {};

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
    ws.onmessage = msg => {
      this.process(msg.data as string);
    };
  }

  private process(msg: string) {
    let packet = JSON.parse(msg) as Packet<any>;

    if (packet.type === packets.bres.__type) {
      let response = packet.payload as typeof packets.bres.__payload;
      if (typeof response.id === "number") {
        let outbound = this.outboundCalls[response.id];
        delete this.outboundCalls[response.id];
        if (outbound) {
          if (response.error) {
            outbound.reject(new RequestError(response.error));
          } else {
            outbound.resolve(response.result);
          }
        }
      }
    } else if (packet.type === packets.qres.__type) {
      let response = packet.payload as typeof packets.qres.__payload;
      let outbound = this.outboundQueries[response.id];
      delete this.outboundQueries[response.id];
      if (outbound) {
        if (response.state === "error") {
          outbound.reject(response.error);
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
    if (TYPES_THAT_ARE_FORBIDDEN_TO_LISTEN[type]) {
      throw new Error(
        `Can't listen for events of type ${type} - those are used internally`
      );
    }

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

  async call<Params, Result>(
    rc: RequestCreator<Params, Result>,
    params: Params
  ): Promise<Result> {
    let request = rc(params)(this);
    this.send(packets.breq, request);

    return new Promise((resolve, reject) => {
      this.outboundCalls[request.id] = { resolve, reject };
    });
  }

  async query<Params, Result>(
    qc: QueryCreator<Params, Result>,
    params: Params
  ): Promise<Result> {
    let query: QueryRequest<Params> = {
      id: this.generateID(), // shared with butler calls, why not
      method: qc.__method,
      params,
    };
    this.send(packets.qreq, query);

    return new Promise((resolve, reject) => {
      this.outboundQueries[query.id] = { resolve, reject };
    });
  }
}
