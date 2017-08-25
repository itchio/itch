// This file is the entry point for renderer processes

let rt;
if (process.env.ITCH_TIME_REQUIRE === "2") {
  rt = require("require-times")([".js", ".ts", ".tsx"]);
  rt.start();
}

import env from "./env";

if (env.name !== "production") {
  require("bluebird").config({
    longStackTraces: true,
    warnings: true,
  });

  require("source-map-support").install({
    hookRequire: true,
  });
}

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
    /* muffin */
  }
}

import * as electron from "electron";
import App from "./components/app";

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
  ReactDOM.render(
    <Provider store={store}>
      {rootComponent}
    </Provider>,
    appNode
  );
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
  let perf: any;
  if (process.env.ITCH_REACT_PERF === "1") {
    perf = require("react-addons-perf");
    perf.start();
  }
  render(App);
  if (perf) {
    perf.stop();
    (window as any).perf = perf;
    console.log(`Perf available as window.perf, enjoy!`);
  }

  if (module.hot) {
    module.hot.accept(() => {
      const NextApp = require("./components/app").default;
      render(NextApp);
    });
  }
}

start();
