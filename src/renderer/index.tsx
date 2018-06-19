// This file is the entry point for renderer processes

import { parse as parseQueryString } from "querystring";

import env from "common/env";
if (process.env.NODE_ENV !== "production") {
  require("react-hot-loader/patch");
  require("bluebird").config({
    longStackTraces: true,
  });
}

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import store from "renderer/store";

import setupShortcuts from "renderer/shortcuts";
setupShortcuts(store);

import * as globalStyles from "renderer/global-styles";
globalStyles.inject();

let AppContainer: React.ComponentClass<{}>;
if (env.development) {
  try {
    const rhl = require("react-hot-loader");
    AppContainer = rhl.AppContainer;
  } catch (e) {
    console.error(`Could not enable react-hot-loader:`, e);
  }
}

import electron from "electron";
import App from "renderer/App";
import { actions } from "common/actions/index";
import { ExtendedWindow } from "common/types";
import { rendererWindow } from "common/util/navigation";

let appNode: Element | null;

function render(RealApp: typeof App) {
  document.querySelector("body")!.classList.remove("loading");
  appNode = document.querySelector("#app");

  let rootComponent: JSX.Element;
  if (AppContainer) {
    rootComponent = (
      <AppContainer>
        <RealApp />
      </AppContainer>
    );
  } else {
    rootComponent = <RealApp />;
  }
  ReactDOM.render(<Provider store={store}>{rootComponent}</Provider>, appNode);
}

window.addEventListener("beforeunload", () => {
  if (appNode) {
    ReactDOM.unmountComponentAtNode(appNode);
    appNode = null;
  }
});

// disable two-finger zoom on macOS

if (process.platform === "darwin") {
  try {
    electron.webFrame.setVisualZoomLevelLimits(1, 1);
  } catch (e) {
    console.log(`couldn't disable two-finger zoom: ${e.stack || e}`);
  }
}

async function start() {
  const opts = parseQueryString(location.search.replace(/^\?/, ""));
  const extWindow = window as ExtendedWindow;
  extWindow.itchWindow = {
    window: String(opts.window),
    role: String(opts.role) as any,
  };

  render(App);

  if (module.hot) {
    module.hot.accept("renderer/App", () => {
      const NextApp = require("renderer/App").default;
      render(NextApp);
    });
  }
}

start();

// disallow navigating by dragging a link over the app's window, cf.
// https://stackoverflow.com/questions/31670803/prevent-electron-app-from-redirecting-when-dragdropping-items-in-window
document.addEventListener("dragover", event => {
  event.preventDefault();
});
document.addEventListener("drop", event => {
  event.preventDefault();
  const urls = event.dataTransfer.getData("text/uri-list");
  if (urls) {
    urls.split("\n").forEach(url => {
      store.dispatch(actions.navigate({ window: rendererWindow(), url }));
    });
  }
});
