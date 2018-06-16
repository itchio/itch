import "!style-loader!css-loader!../fonts/icomoon/style.css";
import "!style-loader!css-loader!../fonts/lato/latofonts-custom.css";
import "!style-loader!css-loader!react-hint/css/index.css";
import "!style-loader!css-loader!react-json-inspector/json-inspector.css";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import { doesEventMeanBackground } from "renderer/helpers/whenClickNavigates";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import Layout from "renderer/App/Layout";
import Modal from "renderer/App/Modal";

class AppContents extends React.PureComponent<DerivedProps> {
  render() {
    return (
      <div onClickCapture={this.onClickCapture}>
        <Layout />
        <Modal />
      </div>
    );
  }

  onClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    this.handleClickCapture(e, e.target as HTMLElement);
  };

  handleClickCapture(e: React.MouseEvent<HTMLElement>, target: HTMLElement) {
    if (!target) {
      return;
    }

    if (target.tagName == "A") {
      const href = (target as HTMLLinkElement).href;
      e.preventDefault();
      e.stopPropagation();
      this.props.navigate({
        window: rendererWindow(),
        url: href,
        background: doesEventMeanBackground(e),
      });
    } else {
      this.handleClickCapture(e, target.parentElement);
    }
  }
}

const actionCreators = actionCreatorsList("navigate");
type DerivedProps = Dispatchers<typeof actionCreators>;

export default connect<{}>(
  AppContents,
  {
    actionCreators,
  }
);
