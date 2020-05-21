import "!style-loader!css-loader!./fonts/icomoon/style.css";
import "!style-loader!css-loader!./fonts/lato/latofonts-custom.css";
import "tippy.js/dist/tippy.css";

import { packets } from "common/packets";
import { queries } from "common/queries";
import React, { Suspense, useEffect, useState } from "react";
import { hot } from "react-hot-loader/root";
import { IntlProvider } from "react-intl";
import { FullScreenSpinner } from "renderer/basics/LoadingCircle";
import { SocketContext } from "renderer/contexts";
import { Route } from "renderer/Route";
import { theme } from "renderer/theme";
import { ThemeProvider, StyleSheetManager } from "styled-components";
import { Socket } from "renderer/Socket";
import GlobalStyles from "renderer/global-styles";
import { CurrentLocale } from "common/locales";

// whilst we wait for styled-components@5 typings
const ExtendedStyleSheetManager = (StyleSheetManager as any) as React.ComponentClass<{
  stylisOptions?: {
    prefix?: boolean;
  };
}>;

export const App = hot(() => {
  let [socket, setSocket] = useState<Socket | undefined>();
  let [currentLocale, setCurrentLocale] = useState<CurrentLocale | undefined>();

  useEffect(() => {
    (async () => {
      let socket;

      try {
        socket = await establishSocketConnection();
      } catch (e) {
        alert(`While establishing websocket connection:\n\n${e.stack}`);
        return;
      }

      socket.listen(packets.currentLocaleChanged, (params) => {
        console.log(`Locale changed!`);
        setCurrentLocale(params.currentLocale);
      });

      try {
        let { currentLocale } = await socket.query(queries.getCurrentLocale);
        setCurrentLocale(currentLocale);
        setSocket(socket);
      } catch (e) {
        alert(`While fetching current locale:\n\n${e.stack}`);
        return;
      }
    })();
  }, []);

  if (!(socket && currentLocale)) {
    return <div>...</div>;
  }

  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <SocketContext.Provider value={socket}>
        <IntlProvider
          locale={currentLocale.lang}
          messages={currentLocale.strings}
        >
          <ExtendedStyleSheetManager stylisOptions={{ prefix: false }}>
            <ThemeProvider theme={theme}>
              <React.Fragment>
                <GlobalStyles />
                <Route />
              </React.Fragment>
            </ThemeProvider>
          </ExtendedStyleSheetManager>
        </IntlProvider>
      </SocketContext.Provider>
    </Suspense>
  );
});

export default App;

async function establishSocketConnection(): Promise<Socket> {
  const SESSION_WS_KEY = "internal-websocket";

  let address = sessionStorage.getItem(SESSION_WS_KEY);
  if (!address) {
    let res = await fetch("itch://api/websocket-address");
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    let payload = await res.json();
    address = payload.address as string;
    sessionStorage.setItem(SESSION_WS_KEY, address);
  }

  const uid = generateSessionID();
  console.log(`WebSocket session ID:`, uid);

  let u = new URL(address);
  u.searchParams.set("uid", uid);
  address = u.toString();
  console.log(`Connecting to address ${address}`);

  return await Socket.connect(address);
}

function generateSessionID(): string {
  let res = "";
  for (let i = 0; i < 20; i++) {
    res += String.fromCharCode(Math.floor(Math.random() * 26) + 97);
  }
  return res;
}
