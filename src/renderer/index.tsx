type WindowExt = Window & {
  $RefreshReg$: () => void;
  $RefreshSig$: (typ: any) => any;
};

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const runtime = require("react-refresh/runtime");
  runtime.injectIntoGlobalHook(window);
  let winExt = (window as any) as WindowExt;
  winExt.$RefreshReg$ = () => {};
  winExt.$RefreshSig$ = () => (typ: any) => typ;
}

import React from "react";
import ReactDOM from "react-dom";
import App from "renderer/App";
import { Socket } from "renderer/Socket";

export const socket = new Socket();

document.addEventListener("DOMContentLoaded", () => {
  const appContainer = document.querySelector("#app");
  ReactDOM.render(<App />, appContainer);
});
