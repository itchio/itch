import { packets, Packet, PacketCreator } from "packets";

type PacketKey = keyof typeof packets;
type Listener<Payload> = (payload: Payload) => void;
type Cancel = () => void;

export class Socket {
  private ws: WebSocket;
  private listeners: Partial<
    {
      [key in PacketKey]: Listener<any>[];
    }
  >;

  static async connect(address: string): Promise<Socket> {
    let socket = new WebSocket(address);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    return new Socket(socket);
  }

  constructor(ws: WebSocket) {
    this.listeners = {};
    ws.onmessage = msg => {
      this.process(msg.data as string);
    };
  }

  private process(msg: String) {
    console.log("Should process", msg);
  }

  send<T>(p: Packet<T>) {
    this.ws.send(JSON.stringify(p));
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
}
