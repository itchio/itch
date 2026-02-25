import React from "react";
const Profiler = require("react").unstable_Profiler;
import { IntlProvider } from "react-intl";
import { hook } from "renderer/hocs/hook";
import { theme, ThemeProvider, StyleSheetManager } from "renderer/styles";
import AppContents from "renderer/App/AppContents";
import { isEqual } from "underscore";

const enableProfiling = process.env.ITCH_ENABLE_PROFILING === "1";

class App extends React.PureComponent<Props, State> {
  constructor(props: App["props"], context: any) {
    super(props, context);
    this.state = {
      localeVersion: 1,
      locale: "en",
      messages: {},
      localeMessages: {},
      fallbackMessages: {},
    };
  }

  render() {
    if (enableProfiling) {
      return (
        <Profiler id="app" onRender={this.logProfile}>
          {this.realRender()}
        </Profiler>
      );
    } else {
      return this.realRender();
    }
  }

  logProfile = (id, phase, actualTime, baseTime, startTime, commitTime) => {
    console.log(`${id}'s ${phase} phase:`);
    console.log(`Actual time: ${actualTime}`);
    console.log(`Base time: ${baseTime}`);
    console.log(`Start time: ${startTime}`);
    console.log(`Commit time: ${commitTime}`);
  };

  realRender() {
    const { localeVersion, locale, messages } = this.state;

    return (
      <IntlProvider key={localeVersion} locale={locale} messages={messages}>
        <StyleSheetManager disableVendorPrefixes>
          <ThemeProvider theme={theme}>
            <AppContents />
          </ThemeProvider>
        </StyleSheetManager>
      </IntlProvider>
    );
  }

  static getDerivedStateFromProps(
    props: App["props"],
    state: App["state"]
  ): App["state"] {
    if (
      props.locale !== state.locale ||
      !isEqual(props.localeMessages, state.localeMessages) ||
      !isEqual(props.fallbackMessages, state.fallbackMessages)
    ) {
      let locale = props.locale;
      let localeMessages = props.localeMessages;

      if (!isLocaleValid(locale)) {
        console.warn(`Invalid locale "${locale}", falling back to English`);
        locale = "en";
        localeMessages = props.fallbackMessages;
      }

      return {
        locale,
        localeMessages,
        fallbackMessages: props.fallbackMessages,
        localeVersion: state.localeVersion + 1,
        messages: {
          ...props.fallbackMessages,
          ...localeMessages,
        },
      };
    }
    return null;
  }
}

interface Props {
  locale: string;
  localeMessages: {
    [id: string]: string;
  };
  fallbackMessages: {
    [id: string]: string;
  };
}

interface State {
  messages: {
    [id: string]: string;
  };
  localeVersion: number;

  locale: string;
  localeMessages: {
    [id: string]: string;
  };
  fallbackMessages: {
    [id: string]: string;
  };
}

const emptyObj = {};

function isLocaleValid(locale: string): boolean {
  try {
    Intl.NumberFormat.supportedLocalesOf(locale);
    return true;
  } catch (e) {
    return false;
  }
}

// Normalize locale codes to BCP 47 format (e.g. pt_BR -> pt-BR)
function normalizeLocale(locale: string): string {
  return locale.replace(/_/g, "-");
}

export default hook((map) => ({
  locale: map((rs) => normalizeLocale(rs.i18n.lang)),
  localeMessages: map((rs) => {
    const { strings, lang } = rs.i18n;
    return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
  }),
  fallbackMessages: map((rs) => rs.i18n.strings.en || emptyObj),
}))(App);
