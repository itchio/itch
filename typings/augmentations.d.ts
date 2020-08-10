import "electron";

declare global {
  namespace React {
    interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
      allowFullScreen?: boolean;
      allowpopups?: boolean;
      autoFocus?: boolean;
      autosize?: boolean;
      blinkfeatures?: string;
      disableblinkfeatures?: string;
      disableguestresize?: boolean;
      disablewebsecurity?: boolean;
      guestinstance?: string;
      httpreferrer?: string;
      nodeintegration?: boolean;
      partition?: string;
      plugins?: boolean;
      preload?: string;
      src?: string;
      useragent?: string;
      webpreferences?: string;
      enableremotemodule?: "false";
    }
  }

  interface NodeModule {
    hot?: {
      accept: (name: string, cb: () => void) => void;
    };
  }
}
