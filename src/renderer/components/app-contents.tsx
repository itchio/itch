import React from "react";

import Layout from "./layout";
import Modal from "./modal";

import { connect, actionCreatorsList, Dispatchers } from "./connect";
import { doesEventMeanBackground } from "./when-click-navigates";
import { rendererWindow } from "common/util/navigation";

import "!style-loader!css-loader!../fonts/lato/latofonts.css";
import "!style-loader!css-loader!../fonts/icomoon/style.css";
import "!style-loader!css-loader!react-hint/css/index.css";
import "!style-loader!css-loader!react-json-inspector/json-inspector.css";

class AppContents extends React.PureComponent<IDerivedProps> {
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
type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<{}>(
  AppContents,
  {
    actionCreators,
  }
);
