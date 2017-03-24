
import {EventEmitter} from "events";

const rnil = (): any => null;

import {
  INetRequest,
  IBrowserWindow, IBrowserWindowOpts, IWebContents, ISession,
  IWebRequest,
} from "./types";

interface IFakeRequestOpts {
  statusCode: number;
  status: string;
  body: string;
}

export class FakeRequest implements INetRequest {
  opts: IFakeRequestOpts;

  constructor (opts: IFakeRequestOpts) {
    this.opts = opts;
  }

  setHeader (name: string, value: string) {
    // no-op
  }

  pipe (sink: any) {
    // no-op
  }

  on (evType: string, cb: (...args: any[]) => void) {
    // no-op
  }

  write (chunk: Buffer | string) {
    // no-op
  }

  end () {
    // no-op
  }

  abort() {
    // no-op
  }
}

class FakeIPCMain extends EventEmitter {
  constructor () {
    super();
  }
}

class FakeIPCRenderer extends EventEmitter {
  constructor () {
    super();
  }
  
  send (...args: any[]) {
    const ev = "";
    electron.ipcMain.emit(ev, ...args);
  }
}

class FakeTray {
  setTooltip() {
    return;
  }

  setContextMenu() {
    return;
  }

  on() {
    return;
  }

  displayBalloon() {
    return;
  }
}

class FakeBrowserWindow implements IBrowserWindow {
  id: -1;
  webContents: IWebContents;

  constructor (opts: IBrowserWindowOpts) {
    this.webContents = new FakeWebContents();
    return;
  }

  loadURL (url: string) {
    return;
  }

  getBounds(): any {
    return {};
  }

  setBounds(bounds: any) {
    return;
  }

  setPosition(x: number, y: number) {
    return;
  }

  on(ev: string, cb: (ev: any) => void) {
    return;
  }

  isVisible() {
    return false;
  }

  isDestroyed() {
    return false;
  }

  close() {
    return false;
  }

  hide() {
    return false;
  }

  show() {
    return false;
  }

  maximize() {
    return false;
  }

  setMenu(menu: any) {
    return;
  }

  setMenuBarVisibility(visible: boolean) {
    return;
  }

  setFullScreen(fs: boolean) {
    return;
  }

  isFullScreen(): boolean {
    return false;
  }

  setTitle(title: string): void {
    return;
  }

  getContentSize(): number[] {
    return [0, 0];
  }
}

class FakeWebContents implements IWebContents {
  session: ISession;

  constructor () {
    this.session = new FakeSession();
  }

  openDevTools(opts: any) {
    return;
  }

  isDestroyed() {
    return false;
  }

  setUserAgent(ua: string) {
    return;
  }

  getUserAgent(): string {
    return "";
  }

  on(ev: string, cb: (...args: any[]) => void) {
    return;
  }

  beginFrameSubscription(f: (frameBuffer: Buffer) => void) {
    return;
  }

  endFrameSubscription() {
    return;
  }
}

class FakeSession implements ISession {
  webRequest: IWebRequest;

  constructor () {
    this.webRequest = new FakeWebRequest();
    return;
  }

  getCacheSize(cb: (cacheSize: number) => void) {
    cb(0);
  }

  clearCache(cb: () => void) {
    cb();
  }

  clearStorageData(opts: any, cb: () => void) {
    cb();
  }
}

class FakeWebRequest implements IWebRequest {
  onBeforeRequest(opts: any, cb: any) {
    return;
  }

  onBeforeSendHeaders(opts: any, cb: any) {
    return;
  }
}

const electron = {
  net: {
    request: () => new FakeRequest({
      statusCode: 200,
      status: "OK",
      body: "hi",
    }),
  },
  app: {
    getVersion: () => "1.0",
    getPath: (p: string): string => `tmp/${p}`,
    makeSingleInstance: (cb: () => void) => false,
    quit: rnil,
    on: rnil,
    dock: {
      setMenu: rnil,
      bounce: rnil,
      setBadge: rnil,
    },
  },
  powerSaveBlocker: {
    start: rnil,
    stop: rnil,
  },
  ipcMain: new FakeIPCMain(),
  ipcRenderer: new FakeIPCRenderer(),
  remote: {
    require: (path: string): any => ({}),
    app: null as any,
  },
  shell: {
    openItem: rnil,
    openExternal: rnil,
  },
  dialog: {
    showMessageBox: rnil,
  },
  webFrame: {
    setZoomLevelLimits: rnil,
  },
  Menu: {
    buildFromTemplate: rnil,
    setApplicationMenu: rnil,
  },
  Tray: FakeTray,
  BrowserWindow: FakeBrowserWindow,
};

electron.ipcRenderer.setMaxListeners(Infinity);
electron.ipcMain.setMaxListeners(Infinity);

electron.remote.app = electron.app;

export default electron;
