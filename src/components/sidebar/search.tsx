import * as React from "react";

import { debounce } from "underscore";
import styled, * as styles from "../styles";

import watching, { Watcher } from "../watching";

import { connect } from "../connect";

import { actions, dispatcher } from "../../actions";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatString } from "../format";

const SearchContainer = styled.section`
  position: relative;
  padding: 0 8px;
  margin: 8px 4px;

  input[type="search"] {
    ${styles.searchInput()} width: 100%;
    margin-left: 4px;
    text-indent: 16px;
    padding: 6px 10px 5px 9px;
    height: 32px;
    font-size: 14px;
  }

  .icon-search {
    ${styles.searchIcon()} left: 20px;
  }
`;

@watching
class Search extends React.PureComponent<IDerivedProps> {
  input: HTMLInputElement;

  trigger = debounce(() => {
    if (!this.input) {
      return;
    }
    this.props.search({ query: this.input.value });
  }, 100);

  onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    this.props.focusSearch({});
  };

  onChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.trigger();
  };

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;

    let passthrough = false;

    if (key === "Escape") {
      // default behavior is to clear - don't
    } else if (key === "ArrowDown") {
      this.props.searchHighlightOffset({ offset: 1, relative: true });
      // default behavior is to jump to end of input - don't
    } else if (key === "ArrowUp") {
      this.props.searchHighlightOffset({ offset: -1, relative: true });
      // default behavior is to jump to start of input - don't
    } else {
      passthrough = true;
    }

    if (!passthrough) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;

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
  };

  subscribe(watcher: Watcher) {
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

    watcher.on(actions.trigger, async (store, action) => {
      if (action.payload.command === "back") {
        if (this.input) {
          this.props.closeSearch({});
        }
      }
    });
  }

  render() {
    const { intl } = this.props;

    return (
      <SearchContainer>
        <input
          id="search"
          ref={this.gotInput}
          type="search"
          placeholder={formatString(intl, ["search.placeholder"]) + "..."}
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
          onChange={this.onChange}
          onFocus={this.onFocus}
        />
        <span className="icon icon-search" />
      </SearchContainer>
    );
  }

  gotInput = input => {
    this.input = input;
  };
}

interface IDerivedProps {
  search: typeof actions.search;
  focusSearch: typeof actions.focusSearch;
  closeSearch: typeof actions.closeSearch;
  searchHighlightOffset: typeof actions.searchHighlightOffset;

  intl: InjectedIntl;
}

export default connect<{}>(injectIntl(Search), {
  dispatch: dispatch => ({
    search: dispatcher(dispatch, actions.search),
    focusSearch: dispatcher(dispatch, actions.focusSearch),
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    searchHighlightOffset: dispatcher(dispatch, actions.searchHighlightOffset),
  }),
});
