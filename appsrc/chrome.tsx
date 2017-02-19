"use strict";

// This file is the entry point for renderer processes

import "./boot/env";
import "./boot/bluebird";
import "./boot/fs";
import "./boot/env";
import "./boot/sniff-language";

import os from "./util/os";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Layout from "./components/layout";
import Modal from "./components/modal";
import {Provider} from "react-redux";
import {shell} from "./electron";

import store from "./store";

import setupShortcuts from "./shortcuts";

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === "1";

let devTools: JSX.Element;
if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require("./components/dev-tools").default;
  devTools = <DevTools/>;
}

let appNode: Element;

function render () {
  setupShortcuts(store);

  appNode = document.querySelector("#app");
  const rootComponent = <Provider store={store}>
    <div>
      <Layout/>
      <Modal/>
      {devTools}
    </div>
  </Provider>;
  ReactDOM.render(rootComponent, appNode);
}

document.addEventListener("DOMContentLoaded", render);

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
    shell.openExternal((target as HTMLLinkElement).href);
    return false;
  }
});

// disable two-finger zoom on macOS

if (os.platform() === "darwin") {
  try {
    require("electron").webFrame.setVisualZoomLevelLimits(1, 1);
  } catch (e) {
    console.log(`couldn't disable two-finger zoom: ${e.stack || e}`); // tslint:disable-line:no-console
  }
}
