import "!style-loader!css-loader!./fonts/icomoon/style.css";
import "!style-loader!css-loader!./fonts/lato/latofonts-custom.css";
import "tippy.js/dist/tippy.css";

import { packets } from "common/packets";
import { queries } from "common/queries";
import React, { Suspense, useEffect, useState } from "react";
import { hot } from "react-hot-loader/root";
import { IntlProvider } from "react-intl";
import { Spinner } from "renderer/basics/LoadingCircle";
import { SocketContext } from "renderer/contexts";
import { Route } from "renderer/Route";
import { theme } from "renderer/theme";
import { ThemeProvider, StyleSheetManager } from "styled-components";
import { Socket } from "renderer/Socket";
import GlobalStyles from "renderer/global-styles";

// whilst we wait for styled-components@5 typings
const ExtendedStyleSheetManager = (StyleSheetManager as any) as React.ComponentClass<{
  stylisOptions?: {
    prefix?: boolean;
  };
}>;

export const App = hot(() => {
  let [socket, setSocket] = useState();
  let [currentLocale, setCurrentLocale] = useState();

  useEffect(() => {
    establishSocketConnection()
      .then(socket => {
        socket.listen(packets.currentLocaleChanged, params => {
          console.log(`Locale changed!`);
          setCurrentLocale(params.currentLocale);
        });

        socket
          .query(queries.getCurrentLocale)
          .then(({ currentLocale }) => setCurrentLocale(currentLocale))
          .catch(e => {
            alert(`While fetching current locale:\n\n${e.stack}`);
          });
        setSocket(socket);
      })
      .catch(e => {
        alert(`While establishing websocket connection:\n\n${e.stack}`);
      });
  }, []);

  if (!(socket && currentLocale)) {
    return <div>...</div>;
  }

  return (
    <Suspense fallback={<Spinner />}>
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
    let payload = await res.json();
    address = payload.address as string;
    sessionStorage.setItem(SESSION_WS_KEY, address);
  }

  return await Socket.connect(address);
}
