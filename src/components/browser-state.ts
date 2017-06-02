
import {ITabData} from "../types";

export interface IBrowserState {
  canGoBack: boolean;
  canGoForward: boolean;
  firstLoad: boolean;
  loading: boolean;
  url: string;
}

export interface IBrowserControlProperties {
  tab: string;
  tabPath: string;
  tabData: ITabData;
  browserState: IBrowserState;
  goBack: () => void;
  goForward: () => void;
  stop: () => void;
  reload: () => void;
  openDevTools: () => void;
  loadURL: (url: string) => void;
  frozen: boolean;
  active: boolean;
}
