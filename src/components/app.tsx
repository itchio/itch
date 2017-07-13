import * as React from "react";

import Layout from "./layout";
import Modal from "./modal";

import { ThemeProvider, theme } from "./styles";
import { IntlProvider } from "react-intl";
import { IAppState } from "../types";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

const REDUX_DEVTOOLS_ENABLED = process.env.REDUX_DEVTOOLS === "1";

let devTools: JSX.Element;
if (REDUX_DEVTOOLS_ENABLED) {
  const DevTools = require("./dev-tools").default;
  devTools = <DevTools />;
}

class App extends React.PureComponent<IDerivedProps, IState> {
  constructor() {
    super();
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
          <div>
            <Layout />
            <Modal />
            {devTools}
          </div>
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

interface IDerivedProps {
  locale: string;
  messages: {
    [id: string]: string;
  };
  fallbackMessages: {
    [id: string]: string;
  };
}

const emptyObj = {};

export default connect<{}>(App, {
  state: createStructuredSelector({
    locale: (state: IAppState) => state.i18n.lang,
    messages: (state: IAppState) => {
      const { strings, lang } = state.i18n;
      return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
    },
    fallbackMessages: (state: IAppState) => state.i18n.strings.en || emptyObj,
  }),
});
