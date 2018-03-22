// This file is the entry point for renderer processes

let rt;
if (process.env.ITCH_TIME_REQUIRE === "2") {
  rt = require("require-times")([".js", ".ts", ".tsx"]);
  rt.start();
}

if (process.env.NODE_ENV !== "production") {
  require("bluebird").config({
    longStackTraces: true,
  });
}

import env from "./env";
import * as os from "./os";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";

import store from "./store/chrome-store";

import setupShortcuts from "./shortcuts";
setupShortcuts(store);

import * as globalStyles from "./components/global-styles";
globalStyles.inject();

let AppContainer: React.ComponentClass<{}> = null;
if (env.name === "development") {
  try {
    const rhl = require("react-hot-loader");
    AppContainer = rhl.AppContainer;
  } catch (e) {
    console.error(`Could not enable react-hot-loader:`, e);
  }

  if (process.env.ITCH_REACT_FRUGAL === "1") {
    try {
      const frugal = require("react-frugal").default;
      frugal(React, ReactDOM, {
        exclude: [
          /(styled\.|(Connect|Styled|InjectIntl|Hoverable|Dimension)\()/,
        ],
      });
    } catch (e) {
      console.error(`Could not enable react-frugal:`, e);
    }
  }
}

import * as electron from "electron";
import App from "./components/app";
import { actions } from "./actions/index";

let appNode: Element;

function render(RealApp: typeof App) {
  if (rt) {
    rt.end();
    rt = null;
  }

  document.querySelector("body").classList.remove("loading");
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

if (env.name === "test") {
  window.onerror = (evt, source, line, column, err) => {
    console.error(`Unhandled error: ${err.stack}`);
    os.exit(1);
  };
}

window.addEventListener("beforeunload", () => {
  if (appNode) {
    ReactDOM.unmountComponentAtNode(appNode);
    appNode = null;
  }
});

// open actual link elements in external browser

document.addEventListener("click", (e: MouseEvent) => {
  let target = e.target as Element;

  while (target && target.tagName !== "A") {
    target = target.parentNode as Element;
  }

  if (target) {
    e.preventDefault();
    electron.remote.shell.openExternal((target as HTMLLinkElement).href);
    return false;
  }
});

// disable two-finger zoom on macOS

if (os.platform() === "darwin") {
  try {
    electron.webFrame.setVisualZoomLevelLimits(1, 1);
  } catch (e) {
    console.log(`couldn't disable two-finger zoom: ${e.stack || e}`);
  }
}

async function start() {
  render(App);

  if (module.hot) {
    module.hot.accept(() => {
      const NextApp = require("./components/app").default;
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
      store.dispatch(actions.navigate({ url }));
    });
  }
});
