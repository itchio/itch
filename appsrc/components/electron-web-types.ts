
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
