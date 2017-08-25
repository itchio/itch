import "electron";

interface WebViewProps {
  is?: boolean;
  src?: string;
  preload?: string;
  plugins?: string;
  partition?: string;
  sandbox?: boolean;
  ref?: (wv: Electron.WebviewTag) => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "webview": WebViewProps;
    }
  }
  interface NodeModule {
    hot?: {
      accept: (cb: () => void) => void;
    };
  }
}
