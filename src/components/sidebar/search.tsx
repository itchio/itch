import React from "react";

import { debounce } from "underscore";
import styled, * as styles from "../styles";

import watching, { Watcher } from "../watching";

import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { actions } from "../../actions";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatString } from "../format";
import { IRootState } from "../../types/index";
import classNames from "classnames";
import SearchResultsBar from "../search-results/search-results-bar";
import LoadingCircle from "../basics/loading-circle";

const SearchContainerContainer = styled.section`
  .relative-wrapper {
    position: relative;
    height: 0;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 0px 8px;
  margin: 16px 0;
  margin-left: 2px;
  margin-left: 10px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);

  transition: border-color 0.4s;
  &.open {
    border-color: rgba(255, 255, 255, 0.4);
  }

  input[type="search"] {
    ${styles.searchInput()};
    width: 100%;
    margin-left: 4px;
    height: 32px;
    font-size: inherit;

    &:focus {
      outline: none;
    }
  }

  .search-icon {
    ${styles.searchIcon()};
    left: 10px;
    font-size: inherit;
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

  onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.props.closeSearch({});
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
    watcher.on(actions.commandBack, async (store, action) => {
      if (this.input) {
        this.props.closeSearch({});
      }
    });
  }

  render() {
    const { intl, open, loading } = this.props;

    return (
      <SearchContainerContainer>
        <SearchContainer className={classNames({ open })}>
          <input
            id="search"
            ref={this.gotInput}
            type="search"
            placeholder={formatString(intl, ["search.placeholder"]) + "..."}
            onKeyDown={this.onKeyDown}
            onKeyUp={this.onKeyUp}
            onChange={this.onChange}
            onBlur={this.onBlur}
            onFocus={this.onFocus}
          />
          {loading ? (
            <LoadingCircle className="search-icon" progress={-1} />
          ) : (
            <span className="icon icon-search search-icon" />
          )}
          <div className="relative-wrapper">
            <SearchResultsBar />
          </div>
        </SearchContainer>
      </SearchContainerContainer>
    );
  }

  gotInput = input => {
    this.input = input;
  };
}

const actionCreators = actionCreatorsList(
  "search",
  "focusSearch",
  "closeSearch",
  "searchHighlightOffset"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  open: boolean;
  loading: boolean;

  intl: InjectedIntl;
};

export default connect<{}>(injectIntl(Search), {
  state: (rs: IRootState) => ({
    open: rs.profile.search.open,
    loading: rs.profile.search.loading,
  }),
  actionCreators,
});
