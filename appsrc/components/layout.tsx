
import * as React from "react";
import {createStructuredSelector} from "reselect";
import {connect, I18nProps} from "./connect";

import GatePage from "./gate-page";
import HubPage from "./hub-page";
import StatusBar from "./status-bar";
import ReactHint = require("react-hint");

import {IAppState} from "../types";

import watching, {Watcher} from "./watching";
import * as actions from "../actions";
import * as ospath from "path";

declare class Notification {
  onclick: () => void;

  constructor(title: string, opts: any)
}

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
@watching
class Layout extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  subscribe (watcher: Watcher) {
    watcher.on(actions.notifyHtml5, async (store, action) => {
      const {title, onClick} = action.payload;
      const opts = {...action.payload.opts};

      if (opts.icon) {
        opts.icon = ospath.resolve(ospath.join(__dirname, opts.icon));
      }
      const notification = new Notification(title, opts);

      if (onClick) {
        notification.onclick = () => {
          store.dispatch(onClick);
        };
      }
    });
  }

  render () {
    return <div className="layout">
      <div className="layout-main">
        <div className="layout-draggable"/>
        {this.main()}
        <StatusBar/>
        <div className="react-hint-container">
          <ReactHint/>
        </div>
      </div>
    </div>;
  }

  main () {
    const {page} = this.props;

    switch (page) {
      case "gate":
        return <GatePage/>;
      case "hub":
        return <HubPage/>;
      default:
        return <div>Unknown page: {page}</div>;
    }
  }
}

interface IProps {}

interface IDerivedProps {
  page: string;
}

export default connect<IProps>(Layout, {
  state: createStructuredSelector({
    page: (state: IAppState) => state.session.navigation.page,
  }),
});
