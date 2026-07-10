import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch } from "common/types";
import { ambientWind, urlForSearch } from "common/util/navigation";
import React from "react";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import GameSearchResult, {
  SetSearchHighlightFunc,
} from "renderer/scenes/HubScene/Sidebar/SearchResultsBar/GameSearchResult";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { each, isEmpty } from "underscore";
import { Game } from "common/butlerd/messages";

const ResultsContainer = styled.div`
  background: ${(props) => props.theme.sidebarBackground};
  z-index: 40;

  position: absolute;
  box-shadow: 0 0 30px ${(props) => props.theme.sidebarBackground};
  border-radius: 0 0 0 2px;

  display: flex;
  flex-direction: column;

  width: 500px;
  max-height: 400px;

  left: -10px;
  top: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;

  /* this scrolls, so we want it to have its own layer */
  will-change: transform;

  flex-grow: 1;

  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const LibrarySectionLabel = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
  padding: 10px 12px 6px;
  text-transform: uppercase;
`;

const LocalEmptyState = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
  padding: 6px 12px 10px;
`;

const SearchOnItchio = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: inherit;
  display: flex;
  flex-shrink: 0;
  font: inherit;
  padding: 10px 12px;
  text-align: left;
  width: 100%;
  cursor: pointer;

  &.chosen,
  &:hover {
    background-color: ${(props) => props.theme.sidebarEntryFocusedBackground};
  }

  &:focus {
    outline: none;
  }

  .icon {
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.smaller};
    margin-left: 8px;
  }

  .query {
    ${styles.singleLine};
  }
`;

@watching
class SearchResultsBar extends React.PureComponent<Props> {
  override render() {
    const { open, games, query } = this.props;
    if (!open || !query) {
      return null;
    }

    return (
      <ResultsContainer className={classNames("results-container", { open })}>
        {this.resultsGrid(games)}
      </ResultsContainer>
    );
  }

  resultList: Element;
  onResultList = (el: Element) => {
    this.resultList = el;
  };

  onSearchOnItchio = () => {
    const { dispatch } = this.props;
    dispatch(actions.closeSearch({}));
    dispatch(
      actions.navigate({
        wind: ambientWind(),
        url: urlForSearch(this.props.query),
      })
    );
  };

  onSearchOnItchioMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Keep the search input focused until this button's click handler runs.
    event.preventDefault();
  };

  subscribe(watcher: Watcher) {
    watcher.on(actions.searchFetched, async (store, action) => {
      if (this.resultList) {
        this.resultList.scrollTop = 0;
      }
    });
  }

  resultsGrid(games: Game[]) {
    const { highlight, query, loading } = this.props;

    const items: React.ReactElement<any>[] = [];

    items.push(
      <SearchOnItchio
        key="search-on-itchio"
        className={classNames({ chosen: highlight === 0 })}
        onClick={this.onSearchOnItchio}
        onMouseDown={this.onSearchOnItchioMouseDown}
        onMouseMove={() => this.props.setSearchHighlight(0)}
      >
        <span className="query">{T(["search.on_itchio", { query }])}</span>
        <span className="icon icon-arrow-right" />
      </SearchOnItchio>
    );

    items.push(
      <LibrarySectionLabel key="library-label">
        {T(["search.results.library"])}
      </LibrarySectionLabel>
    );

    if (loading) {
      items.push(
        <LocalEmptyState key="loading">
          {T(["sidebar.loading"])}
        </LocalEmptyState>
      );
    } else if (isEmpty(games)) {
      items.push(
        <LocalEmptyState key="no-local-results">
          {T(["search.empty.no_local_results"])}
        </LocalEmptyState>
      );
    } else {
      let index = 1;
      each(games, (game) => {
        items.push(
          <GameSearchResult
            key={`game-${game.id}`}
            game={game}
            index={index}
            chosen={index === highlight}
            setSearchHighlight={this.props.setSearchHighlight}
          />
        );
        index++;
      });
    }

    return <ResultList>{items}</ResultList>;
  }
}

interface Props {
  open: boolean;
  highlight: number;
  query: string;
  games: Game[];
  loading: boolean;

  dispatch: Dispatch;
  setSearchHighlight: SetSearchHighlightFunc;
}

export default hook()(SearchResultsBar);
