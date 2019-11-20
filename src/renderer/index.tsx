import "!style-loader!css-loader!./fonts/icomoon/style.css";

import React from "react";
import ReactDOM from "react-dom";
import GlobalStyles from "renderer/global-styles";
import { hot } from "react-hot-loader/root";

import styled, { ThemeProvider, theme } from "./styles";
import { Route } from "renderer/Route";

const App = hot(() => {
  return (
    <ThemeProvider theme={theme}>
      <React.Fragment>
        <GlobalStyles />
        <Route />
      </React.Fragment>
    </ThemeProvider>
  );
});

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<App />, document.querySelector("#app"));
});
