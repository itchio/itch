import "!style-loader!css-loader!./fonts/icomoon/style.css";
import { packets } from "common/packets";
import { queries } from "common/queries";
import React from "react";
import ReactDOM from "react-dom";
import { hot } from "react-hot-loader/root";
import { IntlProvider } from "react-intl";
import GlobalStyles from "renderer/global-styles";
import { Route, SocketContext } from "renderer/Route";
import { Socket } from "renderer/Socket";
import { theme, ThemeProvider } from "./styles";

const AppBase = hot(() => {
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
  ReactDOM.render(<AppBase />, document.querySelector("#app"));
});

function log(...args: any[]) {
  let d = new Date();
  console.log(
    `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`,
    ...args
  );
}

async function establishSocketConnection(): Promise<Socket> {
  const SESSION_WS_KEY = "internal-websocket";

  let address = sessionStorage.getItem(SESSION_WS_KEY);
  if (!address) {
    log(`Fetching websocket address...`);
    let res = await fetch("itch://api/websocket-address");
    log(`Fetching websocket address...done`);
    let payload = await res.json();
    address = payload.address as string;
    sessionStorage.setItem(SESSION_WS_KEY, address);
  }

  log(`Connecting to WebSocket...`);
  let t1 = Date.now();
  let socket = await Socket.connect(address);
  let t2 = Date.now();
  log(`Connecting to WebSocket...done (took ${t2 - t1} ms)`);
  return socket;
}

async function main() {
  // wait for DOM to be loaded
  let domPromise = new Promise((resolve, reject) => {
    document.addEventListener("DOMContentLoaded", () => resolve());
  });

  // establish WebSocket connection
  let socket = await establishSocketConnection();
  log(`Got socket`);

  let { currentLocale } = await socket.query(queries.getCurrentLocale);
  log(`Got current locale`);

  await domPromise;
  log(`DOM content loaded`);

  const appContainer = document.querySelector("#app");

  let render = () => {
    ReactDOM.render(
      <SocketContext.Provider value={socket}>
        <IntlProvider
          locale={currentLocale.lang}
          messages={currentLocale.strings}
        >
          <AppBase />
        </IntlProvider>
      </SocketContext.Provider>,
      appContainer
    );
  };

  log(`First render!`);
  render();

  socket.listen(packets.currentLocaleChanged, params => {
    currentLocale = params.currentLocale;
    log(`Local switched, re-rendering`);
    render();
  });
}

main().catch(e => alert(`Something went very wrong: ${e.stack ? e.stack : e}`));
