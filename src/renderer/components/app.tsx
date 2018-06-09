import React from "react";

import Layout from "./layout";
import Modal from "./modal";

import { ThemeProvider, theme } from "./styles";
import { IntlProvider } from "react-intl";
import { IRootState } from "common/types";
import { connect, actionCreatorsList, Dispatchers } from "./connect";
import { createStructuredSelector } from "reselect";
import { doesEventMeanBackground } from "./when-click-navigates";
import { rendererWindow } from "common/util/navigation";

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
          <div onClickCapture={this.onClickCapture}>
            <Layout />
            <Modal />
          </div>
        </ThemeProvider>
      </IntlProvider>
    );
  }

  onClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target && (e.target as any).tagName == "A") {
      const href = (e.target as HTMLLinkElement).href;
      e.preventDefault();
      e.stopPropagation();
      this.props.navigate({
        window: rendererWindow(),
        url: href,
        background: doesEventMeanBackground(e),
      });
    }
  };

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

const actionCreators = actionCreatorsList("navigate");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  locale: string;
  messages: {
    [id: string]: string;
  };
  fallbackMessages: {
    [id: string]: string;
  };
};

const emptyObj = {};

export default connect<{}>(App, {
  state: createStructuredSelector({
    locale: (rs: IRootState) => rs.i18n.lang,
    messages: (rs: IRootState) => {
      const { strings, lang } = rs.i18n;
      return strings[lang] || strings[lang.substring(0, 2)] || emptyObj;
    },
    fallbackMessages: (rs: IRootState) => rs.i18n.strings.en || emptyObj,
  }),
  actionCreators,
});
