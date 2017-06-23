import * as React from "react";
import * as classNames from "classnames";

import { connect, I18nProps } from "../connect";
import { createStructuredSelector } from "reselect";

import { each } from "underscore";

import * as actions from "../../actions";

import { IAppState, ISearchResults } from "../../types";
import { dispatcher } from "../../constants/action-types";

import GameSearchResult from "./game-search-result";
import UserSearchResult from "./user-search-result";

import Button from "../basics/button";
import IconButton from "../basics/icon-button";
import Filler from "../basics/filler";

import { stripUnit } from "polished";
import styled from "../styles";

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

  padding: 8px 12px;

  &.open {
    left: 0;
    opacity: 1.0;
  }
`;

const Category = styled.div`
  padding: 8px;
  margin: 8px 0;
  box-shadow: 0 0 8px #171717;
  font-size: ${props => props.theme.fontSizes.large};
  text-align: center;
  flex-shrink: 0;
`;

const ResultList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;

  flex-grow: 1;

  font-size: ${props => props.theme.fontSizes.baseText};
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  flex-shrink: 0;

  margin-bottom: 8px;

  font-size: ${props => props.theme.fontSizes.large};
`;

const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  padding: 15px;
  box-shadow: 0 0 20px ${props => props.theme.sidebarBackground};
`;

const NoResults = styled.p`
  font-size: ${props => props.theme.fontSizes.large};
  text-align: center;
  background-color: #2b2a2a;
  padding: 12px 8px;
  border-radius: 4px;
`;

export class SearchResultBar extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      chosen: 0,
    };
  }

  render() {
    const { t, query, open, results } = this.props;
    if (!open) {
      return null;
    }

    const { closeSearch, navigate } = this.props;

    const openAsTab = () => {
      closeSearch({});
      navigate(`search/${query}`);
    };

    return (
      <ResultsContainer className={classNames({ open })}>
        <Header>
          <h2>{t("search.results.title", { query: query || "" })}</h2>
          <Filler />
          <IconButton icon="cross" onClick={() => closeSearch({})} />
        </Header>
        {this.resultsGrid(results)}
        <Footer>
          <Filler />
          <Button label={t("search.open_as_tab")} onClick={() => openAsTab()} />
          <Filler />
        </Footer>
      </ResultsContainer>
    );
  }

  resultsGrid(results: ISearchResults) {
    const { highlight } = this.props;
    const active = this.props.open;
    const fuseResults = [];

    const hasRemoteResults =
      results &&
      (results.gameResults.result.gameIds.length > 0 ||
        results.userResults.result.userIds.length > 0);
    const hasLocalResults = fuseResults.length > 0;

    if (!(hasRemoteResults || hasLocalResults)) {
      const { t } = this.props;

      return (
        <ResultList>
          <NoResults>{t("search.empty.no_results")}</NoResults>
        </ResultList>
      );
    }

    const items: React.ReactElement<any>[] = [];
    const { navigateToGame, navigateToUser, closeSearch, t } = this.props;

    const { gameResults, userResults } =
      results ||
      ({
        gameResults: {
          result: { gameIds: [] },
          entities: {},
        },
        userResults: {
          result: { userIds: [] },
          entities: [],
        },
      } as ISearchResults);
    const { games } = gameResults.entities;
    const { users } = userResults.entities;

    let index = 0;

    if (fuseResults.length > 0) {
      items.push(<Category>{t("search.results.local")}</Category>);
      each(fuseResults.slice(0, 5), result => {
        const game = result.item;
        items.push(
          <GameSearchResult
            key={`game-${game.id}`}
            game={game}
            chosen={index++ === highlight}
            active={active}
            onClick={() => {
              navigateToGame(game);
              closeSearch({});
            }}
          />,
        );
      });
    }

    const { userIds } = userResults.result;
    if (userIds.length > 0) {
      items.push(<Category>{t("search.results.creators")}</Category>);
      each(userResults.result.userIds, userId => {
        const user = users[userId];
        items.push(
          <UserSearchResult
            key={`user-${userId}`}
            user={user}
            chosen={index++ === highlight}
            active={active}
            onClick={() => {
              navigateToUser(user);
              closeSearch({});
            }}
          />,
        );
      });
    }

    const { gameIds } = gameResults.result;
    if (gameIds.length > 0) {
      items.push(<Category>{t("search.results.games")}</Category>);
      each(gameResults.result.gameIds, gameId => {
        const game = games[gameId];
        items.push(
          <GameSearchResult
            key={`game-${gameId}`}
            game={game}
            chosen={index++ === highlight}
            active={active}
            onClick={() => {
              navigateToGame(game);
              closeSearch({});
            }}
          />,
        );
      });
    }

    return (
      <ResultList>
        {items}
      </ResultList>
    );
  }
}

interface IProps {}

interface IDerivedProps {
  open: boolean;
  highlight: number;
  query: string;
  results: ISearchResults;

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
    open: (state: IAppState) => state.session.search.open,
    highlight: (state: IAppState) => state.session.search.highlight,
    query: (state: IAppState) => state.session.search.query,
    results: (state: IAppState) => state.session.search.results,
  }),
  dispatch: dispatch => ({
    closeSearch: dispatcher(dispatch, actions.closeSearch),
    navigate: dispatcher(dispatch, actions.navigate),
    navigateToGame: dispatcher(dispatch, actions.navigateToGame),
    navigateToUser: dispatcher(dispatch, actions.navigateToUser),
  }),
});
