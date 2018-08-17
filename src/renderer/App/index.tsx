import React from "react";
import { IntlProvider } from "react-intl";
import { hook } from "renderer/hocs/hook";
import { theme, ThemeProvider } from "renderer/styles";
import AppContents from "renderer/App/AppContents";

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
    const { localeVersion, locale, messages } = this.state;
    return (
      <IntlProvider key={localeVersion} locale={locale} messages={messages}>
        <ThemeProvider theme={theme}>
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
      props.localeMessages !== state.localeMessages ||
      props.fallbackMessages !== state.fallbackMessages
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

export default hook(map => ({
  locale: map(rs => rs.i18n.lang),
  localeMessages: map(rs => {
    const { strings, lang } = rs.i18n;
    return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
  }),
  fallbackMessages: map(rs => rs.i18n.strings.en || emptyObj),
}))(App);
