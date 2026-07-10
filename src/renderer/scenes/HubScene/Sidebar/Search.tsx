import classNames from "classnames";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { urlForGame, urlForSearch } from "common/util/navigation";
import React from "react";
import Floater from "renderer/basics/Floater";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import SearchResultsBar from "renderer/scenes/HubScene/Sidebar/SearchResultsBar";
import styled, * as styles from "renderer/styles";
import { TString } from "renderer/t";
import { debounce, size } from "underscore";
import { injectIntl, IntlShape } from "react-intl";

const SearchContainerContainer = styled.section`
  .relative-wrapper {
    position: relative;
    height: 0;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 0px 8px;
  margin: 16px 10px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);

  transition: border-color 0.4s;
  &.open {
    border-color: rgba(255, 255, 255, 0.4);
  }

  input[type="search"] {
    ${styles.searchInput} // mixin!
    width: 100%;
    margin-left: 4px;
    height: 32px;
    font-size: inherit;

    &:focus {
      outline: none;
    }
  }

  .search-icon {
    ${styles.searchIcon};
    font-size: inherit;
  }

  .search-icon-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    transition: opacity 0.2s;
    left: 8px;

    &.enter-pending {
      opacity: 0.5;
    }
  }
`;

@watching
class Search extends React.PureComponent<Props, State> {
  input: HTMLInputElement;

  constructor(props: Search["props"], context: any) {
    super(props, context);
    this.state = {
      open: false,
      loading: false,
      highlight: 0,
      games: [],
      query: "",
      enterPending: false,
    };
  }

  trigger = debounce((query: string) => {
    if (!this.input || query !== this.input.value) {
      return;
    }
    const { profileId } = this.props;

    if (query == "") {
      this.setState({
        games: [],
        loading: false,
      });
      return;
    }

    doAsync(async () => {
      this.setState({ loading: true });
      try {
        const { games } = await rcall(messages.SearchGames, {
          profileId,
          query,
        });
        if (query === this.state.query) {
          this.setState({ games });
        }
      } catch {
        if (query === this.state.query) {
          this.setState({ games: [] });
        }
      } finally {
        if (query !== this.state.query) {
          return;
        }
        this.setState({ loading: false, highlight: 0 });
        if (this.state.enterPending) {
          this.setState({ enterPending: false });
          if (this.state.open) {
            this.openItchioSearch(query);
          }
        }
      }
    });
  }, 100);

  onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    this.setOpened(true);
  };

  onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.setOpened(false);
  };

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.currentTarget.value;
    this.setState({
      query,
      loading: query !== "",
      highlight: 0,
      enterPending: false,
    });
    this.trigger(query);
  };

  searchHighlightOffset(offset: number) {
    let highlight = this.state.highlight + offset;
    const numResults = size(this.state.games) + (this.state.query ? 1 : 0);

    if (numResults == 0) {
      highlight = 0;
    } else {
      if (highlight >= numResults) {
        highlight = numResults - 1;
      }
      if (highlight < 0) {
        highlight = 0;
      }
    }

    this.setState({ highlight });
  }

  setSearchHighlight = (index: number) => {
    this.setState({ highlight: index });
  };

  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;

    let passthrough = false;

    if (key === "Escape") {
      // default behavior is to clear - don't
    } else if (key === "ArrowDown") {
      this.searchHighlightOffset(1);
      // default behavior is to jump to end of input - don't
    } else if (key === "ArrowUp") {
      this.searchHighlightOffset(-1);
      // default behavior is to jump to start of input - don't
    } else if (key === "Enter") {
      if (this.state.loading) {
        this.setState({ enterPending: true });
      } else {
        this.openHighlightedResult();
      }
    } else {
      passthrough = true;
    }

    if (!passthrough) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return true;
  };

  openHighlightedResult = () => {
    const { games, highlight } = this.state;
    const game = games[highlight - 1];
    if (!game) {
      this.openItchioSearch();
      return;
    }

    this.setOpened(false);
    if (this.input) {
      this.input.blur();
    }
    this.props.dispatch(
      actions.navigate({
        wind: "root",
        url: urlForGame(game.id),
      })
    );
  };

  openItchioSearch = (query = this.state.query) => {
    this.setOpened(false);
    if (this.input) {
      this.input.blur();
    }
    this.props.dispatch(
      actions.navigate({
        wind: "root",
        url: urlForSearch(query),
      })
    );
  };

  subscribe(watcher: Watcher) {
    watcher.on(actions.focusSearch, async (store, action) => {
      if (this.input) {
        this.input.focus();
        this.input.select();
      }
      this.setOpened(true);
    });

    watcher.on(actions.commandBack, async (store, action) => {
      if (this.input) {
        this.input.blur();
      }
      this.setOpened(false);
    });

    watcher.on(actions.closeSearch, async (store, action) => {
      if (this.input) {
        this.input.blur();
      }
      this.setOpened(false);
    });
  }

  override render() {
    const { intl } = this.props;
    const { loading, open } = this.state;

    return (
      <SearchContainerContainer>
        <SearchContainer className={classNames({ open })}>
          <input
            id="search"
            ref={this.gotInput}
            type="search"
            placeholder={TString(intl, ["search.placeholder"]) + "..."}
            onKeyDown={this.onKeyDown}
            onChange={this.onChange}
            onBlur={this.onBlur}
            onFocus={this.onFocus}
          />
          {loading ? (
            <div
              className={classNames("search-icon search-icon-loading", {
                "enter-pending": this.state.enterPending,
              })}
            >
              <Floater tiny />
            </div>
          ) : (
            <span className="icon icon-search search-icon" />
          )}
          <div className="relative-wrapper">
            <SearchResultsBar
              games={this.state.games}
              loading={this.state.loading}
              open={this.state.open}
              query={this.state.query}
              highlight={this.state.highlight}
              setSearchHighlight={this.setSearchHighlight}
            />
          </div>
        </SearchContainer>
      </SearchContainerContainer>
    );
  }

  gotInput = (input: HTMLInputElement) => {
    this.input = input;
  };

  setOpened(open: boolean) {
    this.setState({ open });
    const { dispatch } = this.props;
    dispatch(actions.searchVisibilityChanged({ open }));
  }
}

interface Props {
  profileId: number;
  dispatch: Dispatch;
  intl: IntlShape;
}

interface State {
  highlight: number;
  loading: boolean;
  open: boolean;
  games: Game[];
  query: string;
  enterPending: boolean;
}

export default hook((map) => ({
  profileId: map((rs) => rs.profile.profile.id),
}))(injectIntl(Search));
