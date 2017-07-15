
import {createSelector, createStructuredSelector} from "reselect";
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";

import BrowserControls from "./browser-controls";
import {pathToId} from "../util/navigation";

import {IBrowserState} from "./browser-state";
import {IState, IUserRecord, ITabData, IUserMarketState, IUserRecordSet} from "../types";

export class UserBrowserBar extends React.Component<IUserBrowserBarProps> {
  render () {
    const {browserState} = this.props;
    const {loading} = browserState;
    const barClasses = classNames("browser-bar", "user-browser-bar", {loading});

    return <div className={barClasses}>
      <div className="controls">
        <BrowserControls {...this.props}/>
      </div>
    </div>;
  }
}

interface IUserBrowserBarProps {
  tabPath: string;
  tabData: ITabData;
  browserState: IBrowserState;
  user: IUserRecord;
}

interface IStructuredSelectorResult {
  userId: number;
  userMarket: IUserMarketState;
  tabData: ITabData;
}

interface IUserContainer {
  users?: IUserRecordSet;
}

const mapStateToProps = (initialState: IState, initialProps: IUserBrowserBarProps) => {
  const marketSelector = createStructuredSelector({
    userId: (state: IState, props: IUserBrowserBarProps) => +pathToId(props.tabPath),
    tabData: (state: IState, props: IUserBrowserBarProps) => props.tabData,
  });

  const userSelector = createSelector(
    marketSelector,
    (cs: IStructuredSelectorResult) => {
      const getUser = (market: IUserContainer) => ((market || {} as IUserContainer).users || {})[cs.userId];
      const user = getUser(cs.tabData);
      return {user};
    },
  );
  return userSelector;
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserBrowserBar);
