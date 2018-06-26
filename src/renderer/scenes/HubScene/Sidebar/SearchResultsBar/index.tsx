import classNames from "classnames";
import { actions } from "common/actions";
import urls from "common/constants/urls";
import { RootState, SearchResults } from "common/types";
import { rendererWindow } from "common/util/navigation";
import { hasSearchResults } from "main/reactors/search/search-helpers";
import React from "react";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import watching, { Watcher } from "renderer/hocs/watching";
import GameSearchResult from "renderer/scenes/HubScene/Sidebar/SearchResultsBar/GameSearchResult";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";
import { each, isEmpty } from "underscore";

const ResultsContainer = styled.div`
  background: ${props => props.theme.sidebarBackground};
  z-index: 40;

  position: absolute;
  box-shadow: 0 0 30px ${props => props.theme.sidebarBackground};
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

  flex-grow: 1;

  font-size: ${props => props.theme.fontSizes.baseText};
`;

const NoResults = styled.p`
  font-size: ${props => props.theme.fontSizes.smaller};
  padding: 8px 12px;
`;

@watching
class SearchResultsBar extends React.PureComponent<
  Props & DerivedProps,
  State
> {
  constructor(props: SearchResultsBar["props"], context: any) {
    super(props, context);
    this.state = {
      chosen: 0,
    };
  }

  render() {
    const { open, results } = this.props;
    if (!open) {
      return null;
    }

    return (
      <ResultsContainer className={classNames("results-container", { open })}>
        {this.resultsGrid(results)}
      </ResultsContainer>
    );
  }

  resultList: Element;
  onResultList = (el: Element) => {
    this.resultList = el;
  };

  onOpenAsTab = () => {
    this.props.closeSearch({});
    this.props.navigate({
      window: rendererWindow(),
      url: `${urls.itchio}?${encodeURIComponent(this.props.query)}`,
    });
  };

  subscribe(watcher: Watcher) {
    watcher.on(actions.searchFetched, async (store, action) => {
      if (this.resultList) {
        this.resultList.scrollTop = 0;
      }
    });
  }

  resultsGrid(results: SearchResults) {
    const { highlight, query, example, loading } = this.props;
    const active = this.props.open;

    const items: React.ReactElement<any>[] = [];

    if (!hasSearchResults(results)) {
      items.push(
        <NoResults key="no-results">
          {loading
            ? T(["sidebar.loading"])
            : query
              ? T(["search.empty.no_results"])
              : T(["search.empty.tagline", { example }])}
        </NoResults>
      );
    } else {
      let index = 0;
      const { games } = results;
      if (games && !isEmpty(games.ids)) {
        each(games.ids, gameId => {
          const game = games.set[gameId];
          items.push(
            <GameSearchResult
              key={`game-${gameId}`}
              game={game}
              index={index}
              chosen={index === highlight}
              active={active}
            />
          );
          index++;
        });
      }
    }

    return <ResultList>{items}</ResultList>;
  }
}

interface Props {}

const actionCreators = actionCreatorsList("closeSearch", "navigate");

type DerivedProps = Dispatchers<typeof actionCreators> & {
  open: boolean;
  highlight: number;
  query: string;
  results: SearchResults;
  example: string;
  loading: boolean;
};

interface State {
  chosen: number;
}

export default connect<Props>(
  SearchResultsBar,
  {
    state: createStructuredSelector({
      open: (rs: RootState) => rs.profile.search.open,
      highlight: (rs: RootState) => rs.profile.search.highlight,
      query: (rs: RootState) => rs.profile.search.query,
      results: (rs: RootState) => rs.profile.search.results,
      example: (rs: RootState) => rs.profile.search.example,
      loading: (rs: RootState) => rs.profile.search.loading,
    }),
    actionCreators,
  }
);
