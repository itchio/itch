
import * as React from "react";
import {createStructuredSelector} from "reselect";
import {connect} from "react-redux";

import GatePage from "./gate-page";
import HubPage from "./hub-page";
import StatusBar from "./status-bar";

import {IState} from "../types";

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends React.Component<ILayoutProps, void> {
  render () {
    const {halloween} = this.props;

    return <div className={`layout ${halloween ? "halloween" : ""}`}>
      <div className="layout-main">
        <div className="layout-draggable"/>
        {this.main()}
        <StatusBar/>
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
  mapDispatchToProps
)(Layout);
