import * as React from "react";

import Layout from "./layout";
import Modal from "./modal";

import { ThemeProvider, theme } from "./styles";

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === "1";

let devTools: JSX.Element;
if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require("./dev-tools").default;
  devTools = <DevTools />;
}

export default class App extends React.PureComponent<{}, void> {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <div>
          <Layout />
          <Modal />
          {devTools}
        </div>
      </ThemeProvider>
    );
  }
}
