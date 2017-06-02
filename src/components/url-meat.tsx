
import * as React from "react";
import {connect, I18nProps} from "./connect";

import {pathPrefix, pathToId} from "../util/navigation";
import urls from "../constants/urls";

import {IMeatProps} from "./meats/types";

import BrowserMeat, {ControlsType} from "./browser-meat";
import * as querystring from "querystring";

const emptyObj = {};

export class UrlMeat extends React.PureComponent<IProps & I18nProps, IState> {
  constructor (props: IProps & I18nProps) {
    super();
    this.state = {
      active: props.visible || !props.tabData.restored,
    };
  }

  render () {
    const {active} = this.state;
    if (!active) {
      return null;
    }

    const {tab} = this.props;
    const {url, controls} = this.getUrlAndControls();

    return <BrowserMeat
        url={url}
        tab={tab} 
        {...(this.props as any)}
        controls={controls}/>;
  }

   getUrlAndControls (): IUrlAndControls {
    const {tab, tabData, tabPath} = this.props;

    const tabUrl = tabData.url;

    switch (tab) {
      case "featured":
        return {url: urls.itchio + "/", controls: "generic"};
      default:
        const prefix = pathPrefix(tabPath);
        const suffix = pathToId(tabPath);
        switch (prefix) {
          case "url":
            return {url: suffix, controls: "generic"};
          case "users":
            const users = tabData.users || emptyObj;
            const user = users[suffix];
            if (user) {
              return {url: tabUrl || user.url, controls: "generic"};
            } else {
              return {url: tabUrl, controls: "generic"};
            }
          case "games":
            const games = tabData.games || emptyObj;
            const game = games[suffix];
            if (game) {
              return {url: tabUrl || game.url, controls: "game"};
            } else {
              return {url: tabUrl, controls: "generic"};
            }
          case "search":
            const url = urls.itchio + "/search?" + querystring.stringify({q: suffix});
            return {url, controls: "generic"};
          default:
            return {url: tabUrl || "about:blank", controls: "generic"};
        }
    }    
  }

  componentWillReceiveProps (props: IProps) {
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

export default connect<IProps>(UrlMeat);
