import React from "react";

import { ThemeProvider, theme } from "./styles";
import { IntlProvider } from "react-intl";
import { IRootState } from "common/types";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import Loadable from "react-loadable";
const LoadableAppContents = Loadable({
  loader: () => import("./app-contents"),
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

class App extends React.PureComponent<IDerivedProps, IState> {
  constructor(props: App["props"], context) {
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

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.locale !== this.props.locale ||
      nextProps.messages !== this.props.messages ||
      nextProps.fallbackMessages !== this.props.fallbackMessages
    ) {
      this.updateMessages(nextProps);
    }
  }

  updateMessages(nextProps: IDerivedProps) {
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

interface IState {
  localeVersion: number;
  locale: string;
  messages: {
    [id: string]: string;
  };
}

type IDerivedProps = {
  locale: string;
  messages: {
    [id: string]: string;
  };
  fallbackMessages: {
    [id: string]: string;
  };
};

const emptyObj = {};

export default connect<{}>(
  App,
  {
    state: createStructuredSelector({
      locale: (rs: IRootState) => rs.i18n.lang,
      messages: (rs: IRootState) => {
        const { strings, lang } = rs.i18n;
        return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
      },
      fallbackMessages: (rs: IRootState) => rs.i18n.strings.en || emptyObj,
    }),
  }
);
