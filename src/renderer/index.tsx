// This file is the entry point for renderer processes

import { parse as parseQueryString } from "querystring";

import env from "renderer/env";

env.setNodeEnv();

if (process.env.NODE_ENV === "production") {
  // cf. https://electronjs.org/docs/tutorial/security
  (window as any).eval = global.eval = function () {
    throw new Error(`Sorry, this app does not support window.eval().`);
  };
} else {
  require("bluebird").config({
    longStackTraces: true,
  });
}

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import store from "renderer/store";

import App from "renderer/App";
import { actions } from "common/actions";
import { ExtendedWindow } from "common/types";
import { ambientWind } from "common/util/navigation";

let appNode: Element | null;

function render(RealApp: typeof App) {
  document.querySelector("body")!.classList.remove("loading");
  appNode = document.querySelector("#app");

  let rootComponent: JSX.Element;
  rootComponent = <RealApp />;
  ReactDOM.render(<Provider store={store}>{rootComponent}</Provider>, appNode);
}

window.addEventListener("beforeunload", () => {
  if (appNode) {
    ReactDOM.unmountComponentAtNode(appNode);
    appNode = null;
  }
});

async function start() {
  const opts = parseQueryString(location.search.replace(/^\?/, ""));
  const extWindow = (window as unknown) as ExtendedWindow;
  extWindow.windSpec = {
    wind: String(opts.wind),
    role: String(opts.role) as any,
  };

  render(App);

  // it isn't a guarantee that this code will run
  // after the main process starts listening for
  // this event. Keep sending it so that the main
  // process is sure to receive it
  const intervalId = setInterval(() => {
    store.dispatch(actions.rootWindowReady({}));
  }, 500);

  store.watcher.on(actions.boot, () => {
    clearInterval(intervalId);
  });
}

start();

document.addEventListener("drop", (event) => {
  event.preventDefault();
  const urls = event.dataTransfer.getData("text/uri-list");
  if (urls) {
    urls.split("\n").forEach((url) => {
      store.dispatch(actions.navigate({ wind: ambientWind(), url }));
    });
  }
});
