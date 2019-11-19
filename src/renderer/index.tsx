import React from "react";
import ReactDOM from "react-dom";
import GlobalStyles from "renderer/global-styles";
import { hot } from "react-hot-loader/root";

import styled, { ThemeProvider, theme } from "./styles";
import { Webview } from "renderer/webview";
import { Sidebar } from "renderer/sidebar";

const AppDiv = styled.div`
  background: ${props => props.theme.baseBackground};
  display: flex;
  flex-direction: row;

  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
`;

const MainDiv = styled.div`
  flex-grow: 1;
`;

const App = hot(() => {
  return (
    <ThemeProvider theme={theme}>
      <AppDiv>
        <GlobalStyles />
        <Sidebar />
        <MainDiv style={{ flexGrow: 1 }}>
          <Webview />
        </MainDiv>
      </AppDiv>
    </ThemeProvider>
  );
});

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(<App />, document.querySelector("#app"));
});
