import React from "react";

import { getInjectURL } from "common/util/resources";
import {
  connect,
  Dispatchers,
  actionCreatorsList,
} from "renderer/hocs/connect";

import styled from "renderer/styles";
import LoadingCircle from "renderer/basics/LoadingCircle";
import classNames from "classnames";
import { modalWidgets, IModalWidgetProps } from "./index";
import { rendererWindow } from "common/util/navigation";

const WidgetDiv = styled.div`
  position: relative;
  height: 100%;
  padding: 20px;

  webview {
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
  }

  &.loading {
    webview {
      width: 0;
      height: 0;
    }
  }
`;

class RecaptchaInput extends React.PureComponent<
  IRecaptchaInputProps & DerivedProps,
  State
> {
  webview: Electron.WebviewTag;
  checker: NodeJS.Timer;

  constructor(props: IRecaptchaInputProps & DerivedProps, context) {
    super(props, context);
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
          preload={getInjectURL("captcha")}
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
              window: rendererWindow(),
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

interface State {
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

type DerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IRecaptchaInputProps>(
  RecaptchaInput,
  {
    actionCreators,
  }
);
