
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import {debounce} from "underscore";

import * as actions from "../actions";

import {IState, TabLayout} from "../types";
import {ILocalizer} from "../localizer";
import {IAction, dispatcher} from "../constants/action-types";

import watching, {Watcher} from "./watching";

import Ink = require("react-ink");
import Icon from "./icon";

@watching
class GameFilters extends React.Component<IGameFiltersProps, void> {
  refs: {
    search: HTMLInputElement;
  };

  constructor () {
    super();
    this.onQueryChanged = debounce(this.onQueryChanged.bind(this), 100);
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.focusFilter, async (store, action) => {
      const {search} = this.refs;
      if (search) {
        search.focus();
        search.select();
      }
    });

    watcher.on(actions.clearFilters, async (store, action) => {
      const {search} = this.refs;
      if (search) {
        search.value = "";
      }
    });
  }

  render () {
    const {t, filterQuery, onlyCompatible, showBinaryFilters = true, showLayoutPicker = true} = this.props;

    const layoutPickers: JSX.Element[] = [];

    if (showLayoutPicker) {
      layoutPickers.push(this.renderLayoutPicker("grid", "grid"));
      layoutPickers.push(this.renderLayoutPicker("table", "list"));
    }

    return <section className="filters">
      <section className="search">
        <input className="filter-input-field" ref="search" type="search" defaultValue={filterQuery}
          placeholder={t("grid.criterion.filter")}
          onKeyPress={this.onQueryChanged}
          onKeyUp={this.onQueryChanged}
          onChange={this.onQueryChanged}/>
        <span className={classNames("icon", "icon-filter", {active: !!filterQuery})}/>
      </section>
      {showBinaryFilters
        ? <section className="checkboxes">
          <label>
            <input type="checkbox" checked={onlyCompatible} onChange={
              (e) => this.props.updatePreferences({onlyCompatibleGames: e.currentTarget.checked})
            }/>
            {t("grid.criterion.only_compatible")}
          </label>
        </section>
        : ""}
      {this.props.children}
      <section className="spacer"/>
      {layoutPickers}
    </section>;
  }

  renderLayoutPicker (layout: TabLayout, icon: string) {
    const active = (this.props.layout === layout);

    return <section className={classNames("layout-picker", {active})}
      onClick={
      (e) => this.props.updatePreferences({layout})
    }>
      <Icon icon={icon}/>
      <Ink/>
    </section>;
  }

  onQueryChanged () {
    const {search} = this.refs;
    if (!search) {
      return;
    }

    const {tab} = this.props;

    this.props.filterChanged({tab, query: search.value});
  }
}

interface IGameFiltersProps {
  /** id of the tab this filter is for (for remembering queries, etc.) */
  tab: string;

  /** whether or not to show binary filters ('only compatible', etc.) */
  showBinaryFilters: boolean;
  showLayoutPicker: boolean;

  filterQuery: string;
  onlyCompatible: boolean;
  layout: TabLayout;

  t: ILocalizer;

  filterChanged: typeof actions.filterChanged;
  updatePreferences: typeof actions.updatePreferences;
}

const mapStateToProps = (initialState: IState, props: IGameFiltersProps) => {
  const {tab} = props;

  return createStructuredSelector({
    filterQuery: (state: IState) => state.session.navigation.filters[tab],
    layout: (state: IState) => state.preferences.layout,
    onlyCompatible: (state: IState) => state.preferences.onlyCompatibleGames,
  });
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  filterChanged: dispatcher(dispatch, actions.filterChanged),
  updatePreferences: dispatcher(dispatch, actions.updatePreferences),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameFilters);
