
import * as React from "react";
import * as classNames from "classnames";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import {debounce} from "underscore";

import * as actions from "../actions";

import {IAppState, TabLayout} from "../types";
import {dispatcher} from "../constants/action-types";

import watching, {Watcher} from "./watching";

import Ink = require("react-ink");
import Select = require("react-select");
import Icon from "./icon";

import {inkContainer} from "./styles";
import {style, classes} from "typestyle";

const layoutPickerStyle = style(inkContainer, {
  padding: "8px 10px",
  borderRadius: "50%",
  fontSize: "90%",
  filter: "brightness(60%)",
  $nest: {
    "&:hover": {
      cursor: "pointer",
      filter: "brightness(80%)",
    },
  },
});

const activeLayoutPickerStyle = style({
  filter: "brightness(100%)",
});

@watching
class GameFilters extends React.Component<IProps & IDerivedProps & I18nProps, void> {
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
    const {t, filterQuery,
       onlyCompatible, onlyOwned, onlyInstalled,
       showBinaryFilters = true, showLayoutPicker = true} = this.props;

    const compatibleOption = {
      value: "onlyCompatibleGames",
      label: t("grid.filters.options.compatible"),
    };

    const ownedOption = {
      value: "onlyOwnedGames",
      label: t("grid.filters.options.owned"),
    };

    const installedOption = {
      value: "onlyInstalledGames",
      label: t("grid.filters.options.installed"),
    };

    const options = [
        compatibleOption,
        ownedOption,
        installedOption,
    ];

    const value = [];
    if (onlyCompatible) {
      value.push(compatibleOption);
    }
    if (onlyOwned) {
      value.push(ownedOption);
    }
    if (onlyInstalled) {
      value.push(installedOption);
    }

    return <section className="filters">
      <section className="search">
        <input className="filter-input-field" ref="search" type="search" defaultValue={filterQuery}
          placeholder={t("grid.criterion.search")}
          onKeyPress={this.onQueryChanged}
          onKeyUp={this.onQueryChanged}
          onChange={this.onQueryChanged}/>
        <span className={classNames("icon", "icon-filter", { active: !!filterQuery })} />
      </section>
      
      {showBinaryFilters
      ? <section className="tag-filters">
        <Select
          multi={true}
          options={options}
          value={value}
          autoBlur={true}
          noResultsText={t("grid.filters.options.no_results")}
          onChange={(vals: {value: string}[]) => {
            const prefs = {
              onlyCompatibleGames: false,
              onlyInstalledGames: false,
              onlyOwnedGames: false,
            } as {
              [key: string]: boolean;
            };

            for (const val of vals) {
              prefs[val.value] = true;
            }
            this.props.updatePreferences(prefs);
          }}
          placeholder={t("grid.criterion.filter")}/>
      </section>
      : null }

      {this.props.children}
      <section className="spacer"/>
      {showLayoutPicker
      ? this.renderLayoutPickers()
      : null}
    </section>;
  }

  renderLayoutPickers () {
    return <section className="layout-pickers">
      {this.renderLayoutPicker("grid", "grid")}
      {this.renderLayoutPicker("table", "list")}
    </section>;
  }

  renderLayoutPicker (layout: TabLayout, icon: string) {
    const active = (this.props.layout === layout);

    return <section className={classes(layoutPickerStyle, active && activeLayoutPickerStyle)}
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

interface IProps {
  /** id of the tab this filter is for (for remembering queries, etc.) */
  tab: string;

  /** whether or not to show binary filters ('only compatible', etc.) */
  showBinaryFilters?: boolean;
  showLayoutPicker?: boolean;
}

interface IDerivedProps {
  filterQuery: string;
  layout: TabLayout;
  onlyCompatible: boolean;
  onlyOwned: boolean;
  onlyInstalled: boolean;

  filterChanged: typeof actions.filterChanged;
  updatePreferences: typeof actions.updatePreferences;
}

export default connect<IProps>(GameFilters, {
  state: (initialState, props) => {
    const { tab } = props;

    return createStructuredSelector({
      filterQuery: (state: IAppState) => state.session.navigation.filters[tab],
      layout: (state: IAppState) => state.preferences.layout,
      onlyCompatible: (state: IAppState) => state.preferences.onlyCompatibleGames,
      onlyOwned: (state: IAppState) => state.preferences.onlyOwnedGames,
      onlyInstalled: (state: IAppState) => state.preferences.onlyInstalledGames,
    });
  },
  dispatch: (dispatch) => ({
    filterChanged: dispatcher(dispatch, actions.filterChanged),
    updatePreferences: dispatcher(dispatch, actions.updatePreferences),
  }),
});
