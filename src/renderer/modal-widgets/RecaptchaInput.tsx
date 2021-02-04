import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { getInjectURL } from "common/util/resources";
import React from "react";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { ModalWidgetProps, modals } from "common/modals";
import {
  RecaptchaInputParams,
  RecaptchaInputResponse,
} from "common/modals/types";

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

class RecaptchaInput extends React.PureComponent<RecaptchaInputProps, State> {
  webview: Electron.WebviewTag;
  checker: number;

  constructor(props: RecaptchaInput["props"], context: any) {
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
          enableremotemodule="false"
          webpreferences="worldSafeExecuteJavaScript"
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

    this.checker = window.setInterval(() => {
      this.webview
        .executeJavaScript(`window.captchaResponse`, false)
        .then((response: string | undefined) => {
          if (response) {
            const { dispatch } = this.props;
            dispatch(
              actions.closeModal({
                wind: ambientWind(),
                action: modals.recaptchaInput.action({
                  recaptchaResponse: response,
                }),
              })
            );
          }
        })
        .catch((e) => {
          console.error(e);
        });
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

interface RecaptchaInputProps
  extends ModalWidgetProps<RecaptchaInputParams, RecaptchaInputResponse> {
  params: RecaptchaInputParams;
  dispatch: Dispatch;
}

export default hook()(RecaptchaInput);
