import React from "react";
import { IntlProvider } from "react-intl";
import Loadable from "react-loadable";
import { hook } from "renderer/hocs/hook";
import { theme, ThemeProvider } from "renderer/styles";

const LoadableAppContents = Loadable({
  loader: () => import("renderer/App/AppContents"),
  loading: (props: any) => {
    return (
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {props.error ? <pre>{props.error.stack}</pre> : "Loading..."}
      </div>
    );
  },
});

class App extends React.PureComponent<Props, State> {
  constructor(props: App["props"], context: any) {
    super(props, context);
    this.state = {
      localeVersion: 1,
      locale: "en",
      messages: {},
    };
  }

  render() {
    const { localeVersion, locale, messages } = this.state;
    return (
      <IntlProvider key={localeVersion} locale={locale} messages={messages}>
        <ThemeProvider theme={theme}>
          <LoadableAppContents />
        </ThemeProvider>
      </IntlProvider>
    );
  }

  componentWillMount() {
    this.updateMessages(this.props);
  }

  componentWillReceiveProps(nextProps: App["props"]) {
    if (
      nextProps.locale !== this.props.locale ||
      nextProps.messages !== this.props.messages ||
      nextProps.fallbackMessages !== this.props.fallbackMessages
    ) {
      this.updateMessages(nextProps);
    }
  }

  updateMessages(nextProps: App["props"]) {
    this.setState({
      localeVersion: this.state.localeVersion + 1,
      locale: nextProps.locale,
      messages: {
        ...nextProps.fallbackMessages,
        ...nextProps.messages,
      },
    });
  }
}

interface Props {
  locale: string;
  messages: {
    [id: string]: string;
  };
  fallbackMessages: {
    [id: string]: string;
  };
}

interface State {
  localeVersion: number;
  locale: string;
  messages: {
    [id: string]: string;
  };
}

const emptyObj = {};

export default hook(map => ({
  locale: map(rs => rs.i18n.lang),
  messages: map(rs => {
    const { strings, lang } = rs.i18n;
    return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
  }),
  fallbackMessages: map(rs => rs.i18n.strings.en || emptyObj),
}))(App);
