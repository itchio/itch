import classNames from "classnames";
import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Game } from "common/butlerd/messages";
import searchExamples from "common/constants/search-examples";
import { Dispatch } from "common/types";
import { urlForGame } from "common/util/navigation";
import React from "react";
import Floater from "renderer/basics/Floater";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import SearchResultsBar from "renderer/scenes/HubScene/Sidebar/SearchResultsBar";
import styled, * as styles from "renderer/styles";
import { TString } from "renderer/t";
import { debounce, isEmpty, sample, size } from "underscore";
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
      example: pickExample(),
      query: "",
      lastHighlightOffset: 0,
      enterPending: false,
    };
  }

  trigger = debounce(() => {
    if (!this.input) {
      return;
    }
    const { profileId } = this.props;
    const query = this.input.value;
    if (query === this.state.query) {
      this.setState({ loading: false });
      return;
    }

    this.setState({ query });

    if (query == "") {
      this.setState({
        games: [],
        example: pickExample(),
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
        this.setState({ games });
      } catch {
        this.setState({ games: [] });
      } finally {
        this.setState({ loading: false, highlight: 0 });
        if (query == this.state.query && this.state.enterPending) {
          this.setState({ enterPending: false });
          this.setOpened(false);
          if (this.input) {
            this.input.blur();
          }
          if (!isEmpty(this.state.games)) {
            const gameId = this.state.games[0].id;
            this.props.dispatch(
              actions.navigate({
                wind: "root",
                url: urlForGame(gameId),
              })
            );
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

  onChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ loading: true });
    this.trigger();
  };

  searchHighlightOffset(offset: number) {
    let highlight = this.state.highlight + offset;
    const numGames = size(this.state.games);

    if (numGames == 0) {
      highlight = 0;
    } else {
      if (highlight >= size(this.state.games)) {
        highlight = size(this.state.games) - 1;
      }
      if (highlight < 0) {
        highlight = 0;
      }
    }

    this.setState({ highlight, lastHighlightOffset: Date.now() });
  }

  setSearchHighlight = (index: number) => {
    let msSinceLastHighlightSet = Date.now() - this.state.lastHighlightOffset;
    if (msSinceLastHighlightSet < 500) {
      // ignore
      return;
    }

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

  onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = e;

    if (key === "Escape") {
      return;
    } else if (key === "ArrowDown") {
      return;
    } else if (key === "ArrowUp") {
      return;
    } else if (key === "Enter") {
      if (this.state.loading) {
        this.setState({ enterPending: true });
      }
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

  render() {
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
            onKeyUp={this.onKeyUp}
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
              example={this.state.example}
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
  example: string;
  query: string;
  lastHighlightOffset: number;
  enterPending: boolean;
}

function pickExample(): string {
  return sample(searchExamples);
}

export default hook((map) => ({
  profileId: map((rs) => rs.profile.profile.id),
}))(injectIntl(Search));
