
import {WriteStream} from "fs";

export interface IDock {
  bounce(): void;
  setMenu(template: any): void;
  setIcon(icon: string): void;
}

export interface IApp {
  dock: IDock;
  getName(): string;
  getPath(name: string): string;
  getVersion(): string;
  quit(): void;
}

export interface INet {
  request(opts: {method?: string, url?: string, partition?: string}): INetRequest;
}

export interface IIncomingMessage {
  statusCode: number;
  statusMessage: string;
  headers: {
    [key: string]: string[];
  };
  pipe(sink: WriteStream): void;
  setEncoding(encoding: "utf8" | null): void;
  on(ev: "data", cb: (data: any) => void): void;
  on(ev: "end", cb: () => void): void;
}

export interface INetError extends Error {}

export interface INetRequest {
  setHeader(name: string, value: string): void;
  on(ev: "response", cb: (msg: IIncomingMessage) => any): void;
  on(ev: "error", cb: (err: INetError) => any): void;
  on(ev: "abort", cb: (err: any) => any): void;
  on(ev: "login", cb: (authInfo: any, cb: Function) => any): void;
  on(ev: "close", cb: () => any): void;
  write(body: Buffer | string): void;
  end(): void;
  abort(): void;
}
