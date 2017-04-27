
import * as React from "react";
import * as classNames from "classnames";

import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import {each, values} from "underscore";

import * as actions from "../actions";

import Fuse = require("fuse.js");

import {IAppState, IGameRecord, ISessionSearchState, ISearchResults} from "../types";
import {dispatcher} from "../constants/action-types";

import GameSearchResult from "./search-results/game-search-result";
import UserSearchResult from "./search-results/user-search-result";

import {stripUnit} from "polished";
import styled from "./styles";

const ResultsContainer = styled.div`
  background: ${props => props.theme.sidebarBackground};
  border-right: 1px solid ${props => props.theme.sidebarBorder};
  border-bottom: 1px solid ${props => props.theme.sidebarBorder};
  opacity: 0.0;
  z-index: 40;

  width: ${props => props.theme.widths.searchSidebar};

  position: absolute;
  left: ${props => -stripUnit(props.theme.widths.searchSidebar) - 30}px;
  top: 0;
  bottom: 0;
  box-shadow: 0 0 30px ${props => props.theme.sidebarBackground};
  border-radius: 0 0 0 2px;

  overflow: hidden;
  transition: left 0.14s ease-in-out, opacity 0.28s ease-in-out;

  display: flex;
  flex-direction: column;

  &.open {
    left: 0;
    opacity: 1.0;
  }
`;

export class HubSearchResults extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  fuse: Fuse<IGameRecord>;

  constructor () {
    super();
    this.fuse = new Fuse([], {
      keys: [
        { name: "title", weight: 0.9 },
        { name: "shortText", weight: 0.3 },
      ],
      threshold: 0.3,
      include: ["score"],
    });
    this.state = {
      chosen: 0,
    };
  }

  render () {
    const {allGames} = this.props;
    this.fuse.set(allGames);

    const {t, search} = this.props;
    const {query, open, results} = search;

    const {closeSearch, navigate} = this.props;

    const openAsTab = () => {
      closeSearch({});
      navigate(`search/${query}`);
    };

    return <ResultsContainer className={classNames({open})}>
      <div className="header">
        <h2>{t("search.results.title", {query: query || ""})}</h2>
        <div className="filler"/>
        <span className="icon icon-cross close-search" onClick={() => closeSearch({})}/>
      </div>
      {this.resultsGrid(results)}
      <div className="footer">
        <div className="filler"/>
        <div className="button" onClick={() => openAsTab()}>
          {t("search.open_as_tab")}
        </div>
        <div className="filler"/>
      </div>
    </ResultsContainer>;
  }

  resultsGrid (results: ISearchResults) {
    const {typedQuery, highlight} = this.props.search;
    const active = this.props.search.open;
    const fuseResults = typedQuery ? this.fuse.search(typedQuery) : [];

    const hasRemoteResults = results &&
      (results.gameResults.result.gameIds.length > 0 ||
       results.userResults.result.userIds.length > 0);
    const hasLocalResults = fuseResults.length > 0;

    if (!(hasRemoteResults || hasLocalResults)) {
      const {t} = this.props;

      return <div className="result-list">
        <p className="no-results">{t("search.empty.no_results")}</p>
      </div>;
    }

    const items: React.ReactElement<any>[] = [];
    const {navigateToGame, navigateToUser, closeSearch, t} = this.props;

    const {gameResults, userResults} = results || {
      gameResults: {
        result: { gameIds: [] },
        entities: {},
      },
      userResults: {
        result: { userIds: [] },
        entities: [],
      },
    } as ISearchResults;
    const {games} = gameResults.entities;
    const {users} = userResults.entities;

    let index = 0;

    if (fuseResults.length > 0) {
      items.push(<h3>{t("search.results.local")}</h3>);
      each(fuseResults.slice(0, 5), (result) => {
        const game = result.item;
        items.push(<GameSearchResult key={`game-${game.id}`} game={game}
          chosen={index++ === highlight} active={active}
          onClick={() => { navigateToGame(game); closeSearch({}); }}/>);
      });
    }

    const {userIds} = userResults.result;
    if (userIds.length > 0) {
      items.push(<h3>{t("search.results.creators")}</h3>);
      each(userResults.result.userIds, (userId) => {
        const user = users[userId];
        items.push(<UserSearchResult key={`user-${userId}`} user={user}
          chosen={index++ === highlight} active={active}
          onClick={() => { navigateToUser(user); closeSearch({}); }}/>);
      });
    }

    const {gameIds} = gameResults.result;
    if (gameIds.length > 0) {
      items.push(<h3>{t("search.results.games")}</h3>);
      each(gameResults.result.gameIds, (gameId) => {
        const game = games[gameId];
        items.push(<GameSearchResult key={`game-${gameId}`} game={game}
          chosen={index++ === highlight} active={active}
          onClick={() => { navigateToGame(game); closeSearch({}); }}/>);
      });
    }

    return <div className="result-list">
      {items}
    </div>;
  }
}

interface IProps {
}

interface IDerivedProps {
  search: ISessionSearchState;
  allGames: IGameRecord[];

  closeSearch: typeof actions.closeSearch;
  navigate: typeof actions.navigate;
  navigateToGame: typeof actions.navigateToGame;
  navigateToUser: typeof actions.navigateToUser;
}

interface IState {
  chosen: number;
}

export default connect<IProps>(HubSearchResults, {
  state: createStructuredSelector({
    search: (state: IAppState) => state.session.search,
    allGames: createSelector(
      (state: IAppState) => ((state.market || { games: null }).games || {}),
      (games) => values(games),
    ),
  }),
  dispatch: (dispatch) => ({
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    navigate: dispatcher(dispatch, actions.navigate),
    navigateToGame: dispatcher(dispatch, actions.navigateToGame),
    navigateToUser: dispatcher(dispatch, actions.navigateToUser),
  }),
});
