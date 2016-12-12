
import * as React from "react";
import * as classNames from "classnames";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import {debounce} from "underscore";

import * as actions from "../actions";

import {IState} from "../types";
import {ILocalizer} from "../localizer";
import {IAction, dispatcher} from "../constants/action-types";

import watching, {Watcher} from "./watching";

@watching
class GameGridFilters extends React.Component<IGameGridFiltersProps, void> {
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
    const {t, filterQuery, onlyCompatible, showBinaryFilters = true} = this.props;

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
              (e) => this.onCheckboxChanged("onlyCompatible", e.currentTarget.checked)
            }/>
            {t("grid.criterion.only_compatible")}
          </label>
        </section>
        : ""}
      {this.props.children}
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

  onCheckboxChanged (field: string, value: boolean) {
    this.props.binaryFilterChanged({field, value});
  }
}

interface IGameGridFiltersProps {
  /** id of the tab this filter is for (for remembering queries, etc.) */
  tab: string;

  /** whether or not to show binary filters ('only compatible', etc.) */
  showBinaryFilters: boolean;

  filterQuery: string;
  onlyCompatible: boolean;

  t: ILocalizer;

  filterChanged: typeof actions.filterChanged;
  binaryFilterChanged: typeof actions.binaryFilterChanged;
}

const mapStateToProps = (initialState: IState, props: IGameGridFiltersProps) => {
  const {tab} = props;

  return createStructuredSelector({
    filterQuery: (state: IState) => state.session.navigation.filters[tab],
    onlyCompatible: (state: IState) => state.session.navigation.binaryFilters.onlyCompatible,
  });
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  filterChanged: dispatcher(dispatch, actions.filterChanged),
  binaryFilterChanged: dispatcher(dispatch, actions.binaryFilterChanged),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameGridFilters);
