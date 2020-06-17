import { packets } from "common/packets";
import { queries } from "common/queries";
import React, { Suspense, useEffect, useState } from "react";
import { IntlProvider } from "react-intl";
import { FullScreenSpinner } from "renderer/basics/LoadingCircle";
import { Route } from "renderer/Route";
import { theme } from "common/theme";
import { ThemeProvider, StyleSheetManager } from "styled-components";
import GlobalStyles from "renderer/global-styles";
import { CurrentLocale } from "common/locales";
import { socket } from "renderer";

// whilst we wait for styled-components@5 typings
const ExtendedStyleSheetManager = (StyleSheetManager as any) as React.ComponentClass<{
  stylisOptions?: {
    prefix?: boolean;
  };
}>;

export const App = () => {
  let [currentLocale, setCurrentLocale] = useState<CurrentLocale | undefined>();

  useEffect(() => {
    (async () => {
      socket.listen(packets.currentLocaleChanged, (params) => {
        console.log(`Locale changed!`);
        setCurrentLocale(params.currentLocale);
      });

      try {
        let { currentLocale } = await socket.query(queries.getCurrentLocale);
        setCurrentLocale(currentLocale);
      } catch (e) {
        alert(
          `While fetching current locale for ${window.location}:\n\n${e.stack}`
        );
        return;
      }
    })();
  }, []);

  if (!(socket && currentLocale)) {
    return <div>...</div>;
  }

  return (
    <Suspense fallback={<FullScreenSpinner />}>
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
    </Suspense>
  );
};

export default App;
