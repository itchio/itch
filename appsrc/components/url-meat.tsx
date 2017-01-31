
import * as React from "react";
import {connect} from "./connect";

import {pathToId} from "../util/navigation";
import urlParser from "../util/url";
import urls from "../constants/urls";

import BrowserMeat from "./browser-meat";
import * as querystring from "querystring";

import {IState, ITabData} from "../types";

export class UrlMeat extends React.Component<IUrlMeatProps, IUrlMeatState> {
  constructor (props: IUrlMeatProps) {
    super();
    this.state = {
      active: props.visible,
    };
  }

  render () {
    const {path, tabData = {}, tabId, visible} = this.props;
    const {active} = this.state;

    let url = tabData.url || "about:blank";
    let controls = "generic";

    if (/^url/.test(path)) {
      url = path.replace(/^url\//, "");
    } else if (/^games/.test(path)) {
      const gameId = +pathToId(path);
      const game = (tabData.games || {})[gameId];
      if (game) {
        url = game.url;
        const parsed = urlParser.parse(url);
        if (parsed.search) {
          url += parsed.search;
        }
        controls = "game";
      }
    } else if (/^users/.test(path)) {
      const userId = +pathToId(path);
      const user = (tabData.users || {})[userId];
      if (user) {
        url = user.url;
        controls = "user";
      }
    } else if (/^collection/.test(path)) {
      const collectionId = +pathToId(path);
      url = urls.itchio + "/c/" + collectionId + "/x";
    } else if (/^search/.test(path)) {
      const q = pathToId(path);
      url = urls.itchio + "/search?" + querystring.stringify({q});
    } else if (/^featured/.test(path)) {
      url = urls.itchio + "/";
    }

    if (!active) {
      return null;
    }

    return <BrowserMeat key={tabId} url={url} tabId={tabId} tabPath={path}
      tabData={tabData} controls={controls} active={visible}/>;
  }

  componentWillReceiveProps (props: IUrlMeatProps) {
    if (props.visible && !this.state.active) {
      this.setState({
        active: true,
      });
    }
  }
}

interface IUrlMeatProps {
  visible: boolean;
  path: string;
  tabId: string;
  tabData: ITabData;
}

interface IUrlMeatState {
  active: boolean;
}

const mapStateToProps = (state: IState, props: IUrlMeatProps) => ({
  tabData: state.session.navigation.tabData[props.tabId],
});

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UrlMeat);
