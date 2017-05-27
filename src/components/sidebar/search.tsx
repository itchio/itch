
import * as React from "react";
import * as classNames from "classnames";
import {createStructuredSelector} from "reselect";

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
class Search extends React.PureComponent<IDerivedProps & I18nProps, void> {
  input: HTMLInputElement;

  trigger = debounce(() => {
    if (!this.input) {
      return;
    }
    this.props.search({query: this.input.value});
  }, 100);

  onBlur = debounce((e: React.FocusEvent<HTMLInputElement>) => {
    this.props.closeSearch({});
  }, 200);

  onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    this.props.focusSearch({});
  }

  onChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.trigger();
  }

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

    this.trigger();
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
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
        onChange={this.onChange}
        onFocus={this.onFocus}
        onBlur={this.onBlur}>
      </input>
      <span className="icon icon-search" />
    </SearchContainer>;
  }
}

interface IDerivedProps {
  loading: boolean;

  search: typeof actions.search;
  focusSearch: typeof actions.focusSearch;
  closeSearch: typeof actions.closeSearch;
  searchHighlightOffset: typeof actions.searchHighlightOffset;
}

export default connect<void>(Search, {
  state: createStructuredSelector({
    loading: (state) => state.session.search.loading,
  }),
  dispatch: (dispatch) => ({
    search: dispatcher(dispatch, actions.search),
    focusSearch: dispatcher(dispatch, actions.focusSearch),
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    searchHighlightOffset: dispatcher(dispatch, actions.searchHighlightOffset),
  }),
});
