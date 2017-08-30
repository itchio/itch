import * as React from "react";

import env from "../env";

import urls from "../constants/urls";

import { IMeatProps } from "./meats/types";

import BrowserMeat, { ControlsType } from "./browser-meat";
import * as querystring from "querystring";
import { Space } from "../helpers/space";

export default class UrlMeat extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super();
    this.state = {
      active: props.visible || !props.tabData.restored,
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
    const { tabData } = this.props;

    const sp = Space.fromData(tabData);
    const tabUrl = sp.web().url;

    switch (sp.prefix) {
      case "featured":
        if (env.name === "test") {
          return { url: "about:blank", controls: "generic" };
        } else {
          return { url: urls.itchio + "/", controls: "generic" };
        }
      case "url":
        return { url: sp.suffix, controls: "generic" };
      case "users":
        const user = sp.user();
        if (user) {
          return { url: tabUrl || user.url, controls: "generic" };
        } else {
          return { url: tabUrl, controls: "generic" };
        }
      case "games":
        const game = sp.game();
        if (game) {
          return { url: tabUrl || game.url, controls: "game" };
        } else {
          return { url: tabUrl, controls: "generic" };
        }
      case "search":
        const url =
          urls.itchio + "/search?" + querystring.stringify({ q: sp.suffix });
        return { url, controls: "generic" };
      default:
        return { url: tabUrl || "about:blank", controls: "generic" };
    }
  }

  componentWillReceiveProps(props: IProps) {
    if (props.visible && !this.state.active) {
      this.setState({
        active: true,
      });
    }
  }
}

interface IUrlAndControls {
  url: string;
  controls: ControlsType;
}

interface IProps extends IMeatProps {}

interface IState {
  active: boolean;
}
