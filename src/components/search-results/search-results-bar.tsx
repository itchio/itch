import * as React from "react";
import * as classNames from "classnames";

import { connect } from "../connect";
import { createStructuredSelector } from "reselect";

import { each, isEmpty } from "underscore";

import * as actions from "../../actions";
import watching, { Watcher } from "../watching";

import { IRootState, ISearchResults } from "../../types";
import { dispatcher } from "../../constants/action-types";

import GameSearchResult from "./game-search-result";
import UserSearchResult from "./user-search-result";

import Icon from "../basics/icon";
import IconButton from "../basics/icon-button";
import Filler from "../basics/filler";

import { stripUnit, darken } from "polished";
import styled from "../styles";

import format from "../format";
import {
  hasSearchResults,
  excludeIncompatibleSearchResults,
} from "../../reactors/search/search-helpers";
import LoadingCircle from "../basics/loading-circle";
import { filtersContainerHeight } from "../filters-container";

const ResultsContainer = styled.div`
  background: ${props => props.theme.sidebarBackground};
  border-right: 1px solid ${props => props.theme.sidebarBorder};
  border-bottom: 1px solid ${props => props.theme.sidebarBorder};
  opacity: 0;
  z-index: 40;

  width: ${props => props.theme.widths.searchSidebar};

  position: absolute;
  left: ${props => -stripUnit(props.theme.widths.searchSidebar) - 30}px;
  top: ${filtersContainerHeight}px;
  bottom: 0;
  box-shadow: 0 0 30px ${props => props.theme.sidebarBackground};
  border-radius: 0 0 0 2px;

  overflow: hidden;
  transition: left 0.14s ease-in-out, opacity 0.28s ease-in-out;

  display: flex;
  flex-direction: column;

  &.open {
    left: 0;
    opacity: 1;
  }
`;

const UserRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 4px;

  height: 48px;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: scroll;

  flex-grow: 1;

  font-size: ${props => props.theme.fontSizes.baseText};
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  flex-shrink: 0;

  padding: 12px 16px;
  background: ${props => props.theme.accent};
  color: white;
  font-size: ${props => props.theme.fontSizes.large};
`;

const IconContainer = styled.div`
  width: 1.5em;
  height: 1.5em;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-right: 4px;
`;

const NoResults = styled.p`
  font-size: ${props => props.theme.fontSizes.large};
  text-align: center;
  background-color: #2b2a2a;
  padding: 24px 8px;
`;

@watching
export class SearchResultBar extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      chosen: 0,
    };
  }

  render() {
    const { query, open, results, example } = this.props;
    if (!open) {
      return null;
    }

    const { loading } = this.props;

    return (
      <ResultsContainer className={classNames({ open })}>
        <Header>
          <IconContainer>
            {loading ? <LoadingCircle progress={-1} /> : <Icon icon="search" />}
          </IconContainer>
          <h2>
            {query && query != "" ? (
              format(["search.results.title", { query }])
            ) : (
              format(["search.empty.tagline", { example }])
            )}
          </h2>
          <Filler />
          <IconButton icon="arrow-right" onClick={this.onOpenAsTab} />
        </Header>
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
    this.props.navigate({ tab: `search/${this.props.query}` });
  };

  subscribe(watcher: Watcher) {
    watcher.on(actions.searchFetched, async (store, action) => {
      if (this.resultList) {
        this.resultList.scrollTop = 0;
      }
    });
  }

  resultsGrid(results: ISearchResults) {
    const { highlight, query } = this.props;
    const active = this.props.open;
    if (!hasSearchResults(results)) {
      if (query && query != "") {
        return (
          <ResultList ref={this.onResultList}>
            <NoResults>{format(["search.empty.no_results"])}</NoResults>
          </ResultList>
        );
      } else {
        return null;
      }
    }

    const items: React.ReactElement<any>[] = [];
    const { navigateToGame, navigateToUser, closeSearch } = this.props;

    const { users, games } = results;

    let userItems = [];
    if (users && !isEmpty(users.ids)) {
      each(users.ids, userId => {
        const user = users.set[userId];
        userItems.push(
          <UserSearchResult
            key={`user-${userId}`}
            user={user}
            chosen={false}
            active={active}
            onClick={() => {
              navigateToUser({ user });
              closeSearch({});
            }}
          />
        );
      });
    }
    items.push(<UserRow>{userItems}</UserRow>);

    let index = 0;
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
              closeSearch({});
            }}
          />
        );
        index++;
      });
    }

    return <ResultList>{items}</ResultList>;
  }
}

interface IProps {}

interface IDerivedProps {
  open: boolean;
  loading: boolean;
  highlight: number;
  query: string;
  results: ISearchResults;
  example: string;

  closeSearch: typeof actions.closeSearch;
  navigate: typeof actions.navigate;
  navigateToGame: typeof actions.navigateToGame;
  navigateToUser: typeof actions.navigateToUser;
}

interface IState {
  chosen: number;
}

export default connect<IProps>(SearchResultBar, {
  state: createStructuredSelector({
    open: (rs: IRootState) => rs.session.search.open,
    loading: (rs: IRootState) => rs.session.search.loading,
    highlight: (rs: IRootState) => rs.session.search.highlight,
    query: (rs: IRootState) => rs.session.search.query,
    results: (rs: IRootState) => rs.session.search.results,
    example: (rs: IRootState) => rs.session.search.example,
  }),
  dispatch: dispatch => ({
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    navigate: dispatcher(dispatch, actions.navigate),
    navigateToGame: dispatcher(dispatch, actions.navigateToGame),
    navigateToUser: dispatcher(dispatch, actions.navigateToUser),
  }),
});
