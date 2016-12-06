
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

export interface IBrowserWindowOpts {
  title?: string;
  icon?: string;
  width?: number;
  height?: number;
  center?: boolean;
  show?: boolean;
  autoHideMenuBar?: boolean;
  backgroundColor?: string;
  titleBarStyle?: "hidden";
}

export interface IBrowserWindowStatic {
  new(opts: IBrowserWindowOpts): IBrowserWindow;
  getFocusedWindow(): IBrowserWindow;
  fromId(id: number): IBrowserWindow;
  getAllWindows(): IBrowserWindow[];
}

export interface IBrowserWindow {
  id: number;
  webContents: IWebContents;

  loadURL(url: string): void;
  getBounds(): IRectangle;
  setBounds(bounds: IRectangle): void;
  setPosition(x: number, y: number): void;
  on(eventType: string, handler: (e: any) => void): void;
  isVisible(): boolean;
  isDestroyed(): boolean;
  close(): void;
  hide(): void;
  show(): void;
  maximize(): void;
}

export interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** An electron webview */
export interface IWebView {
  /** where cookies/etc. are stored */
  partition: string;

  /** page being shown */
  src: string;

  /** local path to a JavaScript file to load before all others in webview */
  preload: string;

  /** whether plugins are allowed */
  plugins: boolean;

  stop(): void;
  reload(): void;
  goBack(): void;
  goForward(): void;
  loadURL(url: string): void;
  clearHistory(): void;

  getWebContents(): IWebContents;
  canGoBack(): boolean;
  canGoForward(): boolean;

  executeJavaScript(code: string, userGesture?: boolean, callback?: (result: any) => void): void;

  addEventListener(ev: string, cb: (ev: any) => void): void;
  removeEventListener(ev: string, cb: (ev: any) => void): void;
}

/** An electron webcontents */
export interface IWebContents {
  session: ISession;

  openDevTools(opts?: {mode?: string}): void;
  isDestroyed(): boolean;
}

/** An electron web session */
export interface ISession {
  webRequest: IWebRequest;
}

export interface IWebRequest {
  onBeforeRequest: (filter: IWebRequestFilter, cb: IWebRequestCallback) => void;
}

export interface IWebRequestFilter {
  urls: string[];
}

export interface IWebRequestCallback {
  (details: {url: string}, cb: IWebRequestResponseCallback): void;
}

export interface IWebRequestResponseCallback {
  (opts: IWebRequestResponseCallbackOpts): void;
}

export interface IWebRequestResponseCallbackOpts {
  cancel?: boolean;
}
