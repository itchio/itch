import React from "react";

import env from "../env";

import urls from "../constants/urls";

import { IMeatProps } from "./meats/types";

import BrowserMeat, { ControlsType } from "./browser-meat";
import { Space } from "../helpers/space";

class UrlMeat extends React.PureComponent<IProps, IState> {
  constructor(props: IProps, context) {
    super(props, context);
    this.state = {
      active: props.visible || !props.tabInstance.sleepy,
    };
  }

  render() {
    const { active } = this.state;
    if (!active) {
      return null;
    }

    const { tab } = this.props;
    const { url, controls } = this.getUrlAndControls();

    return (
      <BrowserMeat
        url={url}
        tab={tab}
        {...this.props as any}
        controls={controls}
      />
    );
  }

  getUrlAndControls(): IUrlAndControls {
    const { tabInstance } = this.props;
    let controls = "generic" as ControlsType;

    const sp = Space.fromInstance(tabInstance);
    switch (sp.internalPage()) {
      case "featured":
        if (env.name === "test") {
          return { url: "about:blank", controls };
        } else {
          return { url: urls.itchio + "/", controls };
        }
      case "games":
      case "new-tab":
        // let it simmer
        return { url: "about:blank", controls };
    }

    if (sp.prefix === "games") {
      controls = "game";
    }

    return { url: sp.url(), controls };
  }

  componentWillReceiveProps(props: IProps) {
    if (props.visible && !this.state.active) {
      this.setState({
        active: true,
      });
    }
  }
}

export default UrlMeat;

interface IUrlAndControls {
  url: string;
  controls: ControlsType;
}

interface IProps extends IMeatProps {}

interface IState {
  active: boolean;
}
