
import "../boot/sniff-language";

import * as React from "react";

import Layout from "./layout";
import Modal from "./modal";
import {Provider} from "react-redux";

import store from "../store/chrome-store";

import setupShortcuts from "../shortcuts";
setupShortcuts(store);

import {ThemeProvider, injectGlobal, theme} from "./styles";

// tslint:disable-next-line
injectGlobal`
  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    -webkit-user-select: none;
  }

  body {
    font-size: $base-text-size;
    color: $base-text-color;
  }

  body, input {
    font-family: LatoWeb, sans-serif;
  }

  * {
    box-sizing: border-box;
  }
`;

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === "1";

let devTools: JSX.Element;
if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require("./dev-tools").default;
  devTools = <DevTools/>;
}

export default class App extends React.Component<void, void> {
  render () {
    return <Provider store={store}>
        <ThemeProvider theme={theme}>
        <div>
          <Layout/>
          <Modal/>
          {devTools}
        </div>
      </ThemeProvider>
    </Provider>;
  }
}
