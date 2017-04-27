
import * as React from "react";
import {connect, I18nProps} from "./connect";
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

import {IAppState, ITabs, ITabDataSet, ITabData} from "../types";

import styled from "./styles";

const MeatContainer = styled.div`
  background: ${props => props.theme.meatBackground};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;

  flex-shrink: 1;
  flex-grow: 1;
`;

const MeatTab = styled.div`
  visibility: hidden;
  opacity: 0;
  display: flex;
  flex: 0 1;
  width: 100%;
  height: 0px;

  &.visible {
    visibility: visible;
    opacity: 1;
    display: flex;
    flex: 1 1;
    height: 100%;
  }
`;

export class HubMeat extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {tabData, tabs, id: currentId} = this.props;

    return <MeatContainer>
      {map(sortBy(tabs, (x) => x), (id) => {
        const data = tabData[id];
        if (!data) {
          return;
        }
        const {path} = data;
        const visible = (id === currentId);
        return <MeatTab key={id} className={classNames({visible})}>
          {this.renderTab(id, path, data, visible)}
        </MeatTab>;
      })}
      <HubSearchResults/>
    </MeatContainer>;
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
      return <Collection tabId={tabId} tabPath={path} key={tabId}/>;
    } else if (/^toast\//.test(path)) {
      return <Toast tabId={tabId} data={data} key={tabId}/>;
    } else if (isBrowser) {
      return <UrlMeat tabId={tabId} path={path} key={tabId} visible={visible}/>;
    } else {
      return <div>?</div>;
    }
  }
}

interface IProps {}

interface IDerivedProps {
  /** current tab shown */
  id: string;
  tabs: string[];
  tabData: ITabDataSet;
}

const allTabsSelector = createSelector(
  (state: IAppState) => state.session.navigation.tabs,
  (tabs: ITabs) => tabs.constant.concat(tabs.transient),
);

export default connect<IProps>(HubMeat, {
  state: createStructuredSelector({
    id: (state: IAppState) => state.session.navigation.id,
    tabs: (state: IAppState) => allTabsSelector(state),
    tabData: (state: IAppState) => state.session.navigation.tabData,
  }),
});
