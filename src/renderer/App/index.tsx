import React from "react";
const Profiler = require("react").unstable_Profiler;
import { IntlProvider } from "react-intl";
import { hook } from "renderer/hocs/hook";
import { theme, ThemeProvider } from "renderer/styles";
import { lightTheme } from "renderer/lightTheme";
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
      lightMode: false,
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
    const { lightMode } = this.props;

    return (
      <IntlProvider key={localeVersion} locale={locale} messages={messages}>
        <ThemeProvider theme={lightMode ? lightTheme : theme}>
          <AppContents />
        </ThemeProvider>
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
      return {
        locale: props.locale,
        localeMessages: props.localeMessages,
        fallbackMessages: props.fallbackMessages,
        localeVersion: state.localeVersion + 1,
        messages: {
          ...props.fallbackMessages,
          ...props.localeMessages,
        },
        lightMode: props.lightMode,
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
  lightMode: boolean;
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
  lightMode: boolean;
}

const emptyObj = {};

export default hook((map) => ({
  locale: map((rs) => rs.i18n.lang),
  localeMessages: map((rs) => {
    const { strings, lang } = rs.i18n;
    return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
  }),
  fallbackMessages: map((rs) => rs.i18n.strings.en || emptyObj),
  lightMode: map((rs) => rs.preferences.lightMode),
}))(App);
