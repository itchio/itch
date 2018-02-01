import * as React from "react";

import { debounce } from "underscore";
import styled, * as styles from "../styles";

import watching, { Watcher } from "../watching";

import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { actions } from "../../actions";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatString } from "../format";
import { IRootState } from "../../types/index";
import * as classNames from "classnames";

const SearchContainer = styled.section`
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

  .icon-search {
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

    watcher.on(actions.commandBack, async (store, action) => {
      if (this.input) {
        this.props.closeSearch({});
      }
    });
  }

  render() {
    const { intl, open } = this.props;

    return (
      <SearchContainer className={classNames({ open })}>
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

const actionCreators = actionCreatorsList(
  "search",
  "focusSearch",
  "closeSearch",
  "searchHighlightOffset"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  open: boolean;

  intl: InjectedIntl;
};

export default connect<{}>(injectIntl(Search), {
  state: (rs: IRootState) => ({
    open: rs.session.search.open,
  }),
  actionCreators,
});
