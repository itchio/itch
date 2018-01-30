import * as React from "react";

import { getInjectPath } from "../../os/resources";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

import styled from "../styles";
import LoadingCircle from "../basics/loading-circle";
import * as classNames from "classnames";
import { modalWidgets, IModalWidgetProps } from "./index";

const WidgetDiv = styled.div`
  &.loading {
    webview {
      width: 0;
      height: 0;
    }
  }
`;

class RecaptchaInput extends React.Component<
  IRecaptchaInputProps & IDerivedProps,
  IState
> {
  webview: Electron.WebviewTag;
  checker: NodeJS.Timer;

  constructor() {
    super();
    this.state = {
      loaded: false,
    };
  }

  render() {
    const params = this.props.modal.widgetParams;
    const { url } = params;
    const { loaded } = this.state;

    const classes = classNames("modal-widget", { loaded });

    return (
      <WidgetDiv className={classes}>
        {loaded ? null : <LoadingCircle progress={-1} />}
        <webview
          ref={this.gotWebview}
          src={url}
          style={{ minHeight: "500px" }}
          preload={getInjectPath("captcha")}
        />
      </WidgetDiv>
    );
  }

  gotWebview = (wv: Electron.WebviewTag) => {
    this.webview = wv;
    this.clearChecker();

    if (!this.webview) {
      return;
    }

    this.webview.addEventListener("did-finish-load", () => {
      this.setState({ loaded: true });
    });

    this.checker = setInterval(() => {
      this.webview.executeJavaScript(
        `window.captchaResponse`,
        false,
        (response: string | undefined) => {
          if (response) {
            this.props.closeModal({
              action: modalWidgets.recaptchaInput.action({
                recaptchaResponse: response,
              }),
            });
          }
        }
      );
    }, 500);
  };

  componentWillUnmount() {
    this.clearChecker();
  }

  clearChecker() {
    if (this.checker) {
      clearInterval(this.checker);
      this.checker = null;
    }
  }
}

interface IState {
  loaded: boolean;
}

export interface IRecaptchaInputParams {
  url: string;
}

export interface IRecaptchaInputResponse {
  recaptchaResponse: string;
}

interface IRecaptchaInputProps
  extends IModalWidgetProps<IRecaptchaInputParams, IRecaptchaInputResponse> {
  params: IRecaptchaInputParams;
}

const actionCreators = actionCreatorsList("closeModal");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IRecaptchaInputProps>(RecaptchaInput, {
  actionCreators,
});
