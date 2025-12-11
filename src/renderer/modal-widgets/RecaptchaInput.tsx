import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { resources } from "renderer/bridge";
import React from "react";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { ModalWidgetProps } from "common/modals";
import modals from "renderer/modals";
import watching, { Watcher } from "renderer/hocs/watching";
import {
  RecaptchaInputParams,
  RecaptchaInputResponse,
} from "common/modals/types";

const WidgetDiv = styled.div`
  position: relative;
  height: 100%;
  margin: 20px;
  padding: 10px;
  background-color: black;

  webview {
    height: 700px;
  }

  &.loading {
    webview {
      width: 0;
      height: 0;
    }
  }
`;

@watching
class RecaptchaInput extends React.PureComponent<RecaptchaInputProps, State> {
  webview: Electron.WebviewTag;

  constructor(props: RecaptchaInput["props"], context: any) {
    super(props, context);
    this.state = {
      loaded: false,
    };
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.closeCaptchaModal, async (store, action) => {
      const { dispatch } = this.props;
      const { response } = action.payload;
      dispatch(
        actions.closeModal({
          wind: ambientWind(),
          action: modals.recaptchaInput.action({
            recaptchaResponse: response,
          }),
        })
      );
    });
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
          preload={resources.getInjectURL("captcha")}
          enableremotemodule="false"
          webpreferences="worldSafeExecuteJavaScript"
        />
      </WidgetDiv>
    );
  }

  gotWebview = (wv: Electron.WebviewTag) => {
    this.webview = wv;

    if (!this.webview) {
      return;
    }

    this.webview.addEventListener("did-finish-load", () => {
      this.setState({ loaded: true });
    });
  };
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
