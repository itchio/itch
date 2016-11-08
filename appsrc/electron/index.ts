
// shim module that allows 'import'-ing individual electron modules,
// and replaces them with mocks in the test environment.

import * as env from "../env";

let electron: any;

if (env.name === "test") {
  electron = require("./fake-electron").default;
} else {
  if (process.type === "renderer") {
    electron = require("electron").remote.require("electron");
  } else {
    electron = require("electron");
  }
}

interface IDock {
  bounce(): void;
  setMenu(template: any): void;
  setIcon(icon: string): void;
}

interface IApp {
  dock: IDock;
  getName(): string;
  getPath(name: string): string;
  getVersion(): string;
  quit(): void;
}

export const app = electron.app as IApp;
export const clipboard = electron.clipboard;
export const powerSaveBlocker = electron.powerSaveBlocker;
export const ipcMain = electron.ipcMain;
export const ipcRenderer = electron.ipcRenderer;
export const remote = electron.remote;
export const shell = electron.shell;
export const dialog = electron.dialog;
export const webFrame = electron.webFrame;
export const Menu = electron.Menu;
export const Tray = electron.Tray;
export const BrowserWindow = electron.BrowserWindow;

export interface IMenuItem {
  type?: string;
  label?: string;
  role?: string;
  enabled?: boolean;
  click?: (ev?: any) => void;
  submenu?: IMenuItem[];
}
export type IMenuTemplate = IMenuItem[];

export default electron;
