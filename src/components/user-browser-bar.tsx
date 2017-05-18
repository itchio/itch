
import {createSelector, createStructuredSelector} from "reselect";
import * as React from "react";
import * as classNames from "classnames";
import {connect, I18nProps} from "./connect";

import BrowserControls from "./browser-controls";
import {pathToId} from "../util/navigation";

import {IBrowserControlProperties} from "./browser-state";
import {IAppState, IUserRecord, ITabData, IUserMarketState, IUserRecordSet} from "../types";

export class UserBrowserBar extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
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

interface IProps extends IBrowserControlProperties {}

interface IDerivedProps {
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

export default connect<IProps>(UserBrowserBar, {
  state: (initialState, initialProps) => {
    const marketSelector = createStructuredSelector({
      userId: (state: IAppState, props: IProps) => +pathToId(props.tabPath),
      tabData: (state: IAppState, props: IProps) => props.tabData,
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
  },
});
