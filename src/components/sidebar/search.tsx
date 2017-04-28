
import * as React from "react";
import * as classNames from "classnames";

import {debounce} from "underscore";
import styled, * as styles from "../styles";

import watching, {Watcher} from "../watching";

import {connect, I18nProps} from "../connect";

import * as actions from "../../actions";
import {dispatcher} from "../../constants/action-types";

const SearchContainer = styled.section`
  position: relative;
  padding: 0 8px;
  margin: 8px 4px;

  &.loading .icon-search {
    ${styles.horizontalScan()};
  }

  input[type=search] {
    ${styles.heavyInput()}
    transition: all 0.2s;
    width: 100%;
    text-indent: 14px;
    padding: 6px 10px 5px 9px;
    height: 32px;
    font-size: 14px;
  }

  .icon-search {
    position: absolute;
    left: 20px;
    bottom: 50%;
    transform: translateY(55%);
    font-size: 14px;
    color: ${props => props.theme.inputPlaceholder};
    pointer-events: none;
  }
`;

@watching
class SidebarSearch extends React.Component<IDerivedProps & I18nProps, void> {
  input: HTMLInputElement;

  constructor () {
    super();

    this.triggerSearch = debounce(this.triggerSearch.bind(this), 100);
    this.onSearchKeyUp = this.onSearchKeyUp.bind(this);
    this.onSearchKeyDown = this.onSearchKeyDown.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchFocus = this.onSearchFocus.bind(this);
    this.onSearchBlur = debounce(this.onSearchBlur.bind(this), 200);
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.focusSearch, async (store, action) => {
      if (this.input) {
        this.input.focus();
        this.input.select();
      }
    });

    watcher.on(actions.closeSearch, async (store, action) => {
      if (this.input) {
        this.input.blur();
      }
    });

    watcher.on(actions.triggerBack, async (store, action) => {
      if (this.input) {
        this.input.blur();
      }
    });
  }

  render () {
    const {t, loading} = this.props;

    return <SearchContainer className={classNames({loading})}>
      <input id="search" ref={(input) => this.input = input} type="search"
        placeholder={t("search.placeholder")}
        onKeyDown={this.onSearchKeyDown}
        onKeyUp={this.onSearchKeyUp}
        onChange={this.onSearchChange}
        onFocus={this.onSearchFocus}
        onBlur={this.onSearchBlur}>
      </input>
      <span className="icon icon-search" />
    </SearchContainer>;
  }

  onSearchFocus (e: React.FocusEvent<HTMLInputElement>) {
    this.props.focusSearch({});
  }

  onSearchBlur (e: React.FocusEvent<HTMLInputElement>) {
    this.props.closeSearch({});
  }

  onSearchChange (e: React.FormEvent<HTMLInputElement>) {
    this.triggerSearch();
  }

  onSearchKeyDown (e: React.KeyboardEvent<HTMLInputElement>) {
    const {key} = e;

    let passthrough = false;

    if (key === "Escape") {
      // default behavior is to clear - don't
    } else if (key === "ArrowDown") {
      this.props.searchHighlightOffset({offset: 1});
      // default behavior is to jump to end of input - don't
    } else if (key === "ArrowUp") {
      this.props.searchHighlightOffset({offset: -1});
      // default behavior is to jump to start of input - don't
    } else {
      passthrough = true;
    }

    if (!passthrough) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  onSearchKeyUp (e: React.KeyboardEvent<HTMLInputElement>) {
    const {key} = e;

    if (key === "Escape") {
      return;
    } else if (key === "ArrowDown") {
      return;
    } else if (key === "ArrowUp") {
      return;
    } else if (key === "Enter") {
      return;
    }

    this.triggerSearch();
  }

  triggerSearch () {
    if (!this.input) {
      return;
    }

    this.props.search({query: this.input.value});
  }
}

interface IDerivedProps {
  loading: boolean;

  search: typeof actions.search;
  focusSearch: typeof actions.focusSearch;
  closeSearch: typeof actions.closeSearch;
  searchHighlightOffset: typeof actions.searchHighlightOffset;
}

export default connect<void>(SidebarSearch, {
  state: (state) => ({
    loading: state.session.search.loading,
  }),
  dispatch: (dispatch) => ({
    search: dispatcher(dispatch, actions.search),
    focusSearch: dispatcher(dispatch, actions.focusSearch),
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    searchHighlightOffset: dispatcher(dispatch, actions.searchHighlightOffset),
  }),
});
