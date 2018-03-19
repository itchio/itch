import * as React from "react";
import * as classNames from "classnames";

import { connect, actionCreatorsList, Dispatchers } from "../connect";
import { createStructuredSelector } from "reselect";

import { each, isEmpty } from "underscore";

import { actions } from "../../actions";
import watching, { Watcher } from "../watching";

import { IRootState, ISearchResults } from "../../types";

import GameSearchResult from "./game-search-result";

import styled from "../styles";

import format from "../format";
import urls from "../../constants/urls";
import { hasSearchResults } from "../../reactors/search/search-helpers";

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
class SearchResultBar extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor(props: SearchResultBar["props"], context) {
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
  onResultList = el => {
    this.resultList = el;
  };

  onOpenAsTab = () => {
    this.props.closeSearch({});
    this.props.navigate({
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

  resultsGrid(results: ISearchResults) {
    const { highlight, query, example, loading } = this.props;
    const active = this.props.open;

    const items: React.ReactElement<any>[] = [];
    const { navigateToGame } = this.props;

    if (!hasSearchResults(results)) {
      items.push(
        <NoResults key="no-results">
          {loading
            ? format(["sidebar.loading"])
            : query
              ? format(["search.empty.no_results"])
              : format(["search.empty.tagline", { example }])}
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
              onClick={() => {
                navigateToGame({ game });
              }}
            />
          );
          index++;
        });
      }
    }

    return <ResultList>{items}</ResultList>;
  }
}

interface IProps {}

const actionCreators = actionCreatorsList(
  "closeSearch",
  "navigate",
  "navigateToGame",
  "navigateToUser"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  open: boolean;
  highlight: number;
  query: string;
  results: ISearchResults;
  example: string;
  loading: boolean;
};

interface IState {
  chosen: number;
}

export default connect<IProps>(SearchResultBar, {
  state: createStructuredSelector({
    open: (rs: IRootState) => rs.profile.search.open,
    highlight: (rs: IRootState) => rs.profile.search.highlight,
    query: (rs: IRootState) => rs.profile.search.query,
    results: (rs: IRootState) => rs.profile.search.results,
    example: (rs: IRootState) => rs.profile.search.example,
    loading: (rs: IRootState) => rs.profile.search.loading,
  }),
  actionCreators,
});
