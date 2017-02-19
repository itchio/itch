
import * as React from "react";
import {createStructuredSelector} from "reselect";
import {connect} from "react-redux";

import GatePage from "./gate-page";
import HubPage from "./hub-page";
import StatusBar from "./status-bar";
import ReactHint = require("react-hint");

import {IState} from "../types";

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
class Layout extends React.Component<ILayoutProps, void> {
  subscribe (watcher: Watcher) {
    watcher.on(actions.notifyHtml5, async (store, action) => {
      const {title, onClick} = action.payload;
      const opts = {...action.payload.opts};

      if (opts.icon) {
        opts.icon = ospath.resolve(ospath.join(__dirname, "..", opts.icon));
      }
      const notification = new Notification(title, opts); // eslint-disable-line

      if (onClick) {
        notification.onclick = () => {
          store.dispatch(onClick);
        };
      }
    });
  }

  render () {
    const {halloween} = this.props;

    return <div className={`layout ${halloween ? "halloween" : ""}`}>
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

interface ILayoutProps {
  page: string;
  halloween: boolean;
}

const mapStateToProps = createStructuredSelector({
  page: (state: IState) => state.session.navigation.page,
  halloween: (state: IState) => state.status.bonuses.halloween,
});

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Layout);
