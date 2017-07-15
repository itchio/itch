
import * as React from "react";
import {connect} from "./connect";
import {pathToId} from "../util/navigation";
import {createSelector, createStructuredSelector} from "reselect";
import * as classNames from "classnames";

import HubSearchResults from "./hub-search-results";

import Downloads from "./downloads";
import Preferences from "./preferences";
import History from "./history";
import Location from "./location";
import UrlMeat from "./url-meat";
import Dashboard from "./dashboard";
import Library from "./library";
import Collections from "./collections";
import Collection from "./collection";
import NewTab from "./new-tab";
import Toast from "./toast";

import {sortBy, map} from "underscore";

import {IState, ITabs, ITabDataSet, ITabData} from "../types";

export class HubMeat extends React.Component<IHubMeatProps> {
  render () {
    const {tabData, tabs, id: currentId} = this.props;

    return <div className="hub-meat">
      {map(sortBy(tabs, (x) => x), (id) => {
        const data = tabData[id];
        if (!data) {
          return;
        }
        const {path} = data;
        const visible = (id === currentId);
        const classes = classNames("hub-meat-tab", {visible});
        return <div key={id} className={classes}>
          {this.renderTab(id, path, data, visible)}
        </div>;
      })}
      <HubSearchResults/>
    </div>;
  }

  renderTab (tabId: string, path: string, data: ITabData, visible: boolean): JSX.Element {
    const isBrowser = /^(url|games|users|collections|search|featured)/.test(path);

    if (path === "dashboard") {
      return <Dashboard key={tabId}/>;
    } else if (path === "library") {
      return <Library key={tabId}/>;
    } else if (path === "collections") {
      return <Collections key={tabId}/>;
    } else if (path === "downloads") {
      return <Downloads key={tabId}/>;
    } else if (path === "history") {
      return <History key={tabId}/>;
    } else if (path === "preferences") {
      return <Preferences key={tabId}/>;
    } else if (/^locations/.test(path)) {
      const location = pathToId(path);
      return <Location locationName={location} key={tabId}/>;
    } else if (/^new/.test(path)) {
      return <NewTab tabId={tabId} key={tabId}/>;
    } else if (/^collections\//.test(path)) {
      return <Collection tabId={tabId} tabPath={path} data={data} key={tabId}/>;
    } else if (/^toast\//.test(path)) {
      return <Toast tabId={tabId} tabPath={path} data={data} key={tabId}/>;
    } else if (isBrowser) {
      return <UrlMeat tabId={tabId} path={path} key={tabId} visible={visible}/>;
    } else {
      return <div>?</div>;
    }
  }
}

interface IHubMeatProps {
  /** current tab shown */
  id: string;

  tabs: string[];
  tabData: ITabDataSet;
}

const allTabsSelector = createSelector(
  (state: IState) => state.session.navigation.tabs,
  (tabs: ITabs) => tabs.constant.concat(tabs.transient),
);

const mapStateToProps = createStructuredSelector({
  id: (state: IState) => state.session.navigation.id,
  tabs: (state: IState) => allTabsSelector(state),
  tabData: (state: IState) => state.session.navigation.tabData,
});
const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubMeat);
