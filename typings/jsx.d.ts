
import "electron";

interface WebViewProps {
  is?: boolean;
  src?: string;
  preload?: string;
  plugins?: string;
  partition?: string;
  ref?: (wv: Electron.WebViewElement) => void;
}

// tslint:disable-next-line
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "webview": WebViewProps;
    }
  }
}
