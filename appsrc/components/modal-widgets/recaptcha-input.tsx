
import * as React from "react";

import {connect} from "../connect";
import {IModalWidgetProps} from "./modal-widget";

import {ILocalizer} from "../../localizer";

import * as ospath from "path";
const injectPath = ospath.resolve(__dirname, "..", "..", "inject", "captcha.js");

export class RecaptchaInput extends React.Component<IRecaptchaInputProps> {
  webview: Electron.WebviewTag;
  checker: NodeJS.Timer;

  constructor () {
    super();
    this.gotWebview = this.gotWebview.bind(this);
  }

  render () {
    const params = this.props.modal.widgetParams as IRecaptchaInputParams;
    const {url} = params;

    return <div className="modal-widget">
      <webview ref={this.gotWebview} src={url} style={{minHeight: "400px"}} preload={injectPath}/>
    </div>;
  }

  gotWebview (wv: Electron.WebviewTag) {
    this.webview = wv;
    this.clearChecker();

    if (!this.webview) {
      return;
    }

    this.checker = setInterval(() => {
      this.webview.executeJavaScript(`window.captchaResponse`, false, (response: string | undefined) => {
        if (response) {
          this.props.updatePayload({
            recaptchaResponse: response,
          });
        }
      });
    }, 500);
  }

  componentWillUnmount() {
    this.clearChecker();
  }

  clearChecker() {
    if (this.checker) {
      clearInterval(this.checker)
      this.checker = null;
    }
  }
}

export interface IRecaptchaInputParams {
  url: string;
}

interface IRecaptchaInputProps extends IModalWidgetProps {
  t: ILocalizer;
  params: IRecaptchaInputParams;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RecaptchaInput);

