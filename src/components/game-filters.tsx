
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
import Icon from "./basics/icon";

import styled, * as styles from "./styles";
import {css} from "./styles";

interface ILayoutPickerProps {
  theme?: styles.ITheme;
  active?: boolean;
}

export const FiltersContainer = styled.section`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${props => props.theme.breadBackground};
  box-shadow: 0 4px 8px -4px ${props => props.theme.breadBackground};
  flex-shrink: 0;
  padding-right: 4px;
  min-height: 40px;
`;

const Filler = styled.div`
  flex-grow: 1;
`;

const TagFilters = styled.section`
  margin: 4px 8px;

  .Select {
    width: auto;
    min-width: 350px;
    font-size: 14px;

    &.Select--multi {
      .Select-value {
        background-color: rgba(97, 97, 97, 0.7);
        color: #d8d8d8;

        &, .Select-value-icon {
          border-color: transparent;
        }

        .Select-value-label {
          font-size: 14px;
          line-height: 1.6;
        }

        .Select-value-icon {
          font-size: 18px;
          padding: 1px 3px 0px 5px;

          &:hover, &:focus {
            color: white;
            background-color: rgba(97, 97, 97, 0.5)
          }
        }
      }

      .Select-input input {
        color: white;
        margin-top: 5px;
      }

      .Select-control {
        height: 40px;

        background: none !important;
        border: none !important;
        box-shadow: none !important;

        .Select-placeholder {
          line-height: 40px;
        }
      }
    }
  }
`;

const Search = styled.section`
  margin: 8px 8px;
  position: relative;
  padding: 0;

  .icon-filter {
    ${styles.searchIcon()}

    &.active {
      color: ${props => props.theme.lightAccent};
    }
  }

  /* FIXME: that's pretty bad */
  input[type=search] {
    ${styles.searchInput()}
  }
`;

const LayoutPickers = styled.section`
  display: flex;
`;

const LayoutPicker = styled.section`
  ${styles.inkContainer()}

  padding: 8px 10px;
  border-radius: 50%;
  font-size: 90%;
  filter: brightness(60%);

  &:hover {
    cursor: pointer;
    filter: brightness(80%);
  }

  ${(props: ILayoutPickerProps) => props.active
  ? css`filter: brightness(100%)`
  : ""}
`;

@watching
class GameFilters extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  refs: {
    search: HTMLInputElement;
  };

  onQueryChanged = debounce(() => {
    const {search} = this.refs;
    if (!search) {
      return;
    }

    const {tab} = this.props;

    this.props.filterChanged({tab, query: search.value});
  }, 100)

  constructor () {
    super();
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

    return <FiltersContainer>
      {true ? null :
      <Search>
        <input className="filter-input-field" ref="search" type="search" defaultValue={filterQuery}
          placeholder={t("grid.criterion.search")}
          onKeyPress={this.onQueryChanged}
          onKeyUp={this.onQueryChanged}
          onChange={this.onQueryChanged}/>
        <span className={classNames("icon", "icon-filter", { active: !!filterQuery })} />
      </Search>
      }
      
      {showBinaryFilters
      ? <TagFilters>
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
      </TagFilters>
      : null }

      {this.props.children}
      <Filler/>
      {showLayoutPicker
      ? this.renderLayoutPickers()
      : null}
    </FiltersContainer>;
  }

  renderLayoutPickers () {
    return <LayoutPickers>
      {this.renderLayoutPicker("grid", "grid")}
      {this.renderLayoutPicker("table", "list")}
    </LayoutPickers>;
  }

  renderLayoutPicker (layout: TabLayout, icon: string) {
    const active = (this.props.layout === layout);

    return <LayoutPicker active={active}
      onClick={
      (e) => this.props.updatePreferences({layout})
    }>
      <Icon icon={icon}/>
      <Ink/>
    </LayoutPicker>;
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
