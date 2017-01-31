
// TODO: this module is like the 2016 itch.io halloween event: too long and too ambitious

import * as React from "react";
import * as classNames from "classnames";

import {connect} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import {each, values} from "underscore";

import * as actions from "../actions";

import platformData from "../constants/platform-data";

import isPlatformCompatible from "../util/is-platform-compatible";
import format from "../util/format";
import Fuse = require("fuse.js");

import Icon from "./icon";

import {IState, IGameRecord, IUserRecord, ISessionSearchState, ISearchResults} from "../types";
import {IDispatch, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

import {findDOMNode} from "react-dom";

import watching, {Watcher} from "./watching";

interface IGenericSearchResultProps {
  chosen: boolean;
  active: boolean;
}

@watching
abstract class GenericSearchResult <Props extends IGenericSearchResultProps, State>
    extends React.Component<Props, State> {
  subscribe (watcher: Watcher) {
    watcher.on(actions.triggerOk, async (store, action) => {
      if (this.props.chosen && this.props.active) {
        store.dispatch(actions.navigate(this.getPath()));
        store.dispatch(actions.closeSearch({}));
      }
    });
  }

  componentDidUpdate() {
    if (this.props.chosen) {
      const node = findDOMNode(this);
      (node as any).scrollIntoViewIfNeeded();
    }
  }
  
  abstract getPath(): string
}

export class SearchResult extends GenericSearchResult<ISearchResultProps, void> {
  render () {
    const {game, onClick, chosen} = this.props;
    const {title, stillCoverUrl, coverUrl} = game;

    const platforms: React.ReactElement<any>[] = [];
    let compatible = isPlatformCompatible(game);

    if (game.type === "html") {
      platforms.push(<Icon title="web" icon="earth"/>);
    }

    for (const p of platformData) {
      if ((game as any)[p.field]) {
        platforms.push(<Icon title={p.platform} icon={p.icon}/>);
      }
    }

    let price: React.ReactElement<any> = null;
    if (game.minPrice > 0) {
      price = <span className="price">{format.price("USD", game.minPrice)}</span>;
    }

    const resultClasses = classNames("search-result", {
      ["not-platform-compatible"]: !compatible,
      chosen: chosen,
    });

    return <div className={resultClasses} onClick={onClick} ref="root">
      <img src={stillCoverUrl || coverUrl}/>
      <div className="title-block">
        <h4>{title}</h4>
        <span className="platforms">
          {platforms}
          {price}
        </span>
      </div>
    </div>;
  }

  getPath(): string {
    return `games/${this.props.game.id}`;
  }
}

interface ISearchResultProps {
  game: IGameRecord;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export class UserSearchResult extends GenericSearchResult<IUserSearchResultProps, void> {
  render () {
    const {user, onClick, chosen} = this.props;
    const {displayName, username, stillCoverUrl, coverUrl} = user;

    const resultClasses = classNames("search-result", "user-search-result", {
      chosen,
    });

    return <div className={resultClasses} onClick={onClick}>
      <img src={stillCoverUrl || coverUrl}/>
      <div className="title-block">
        <h4>{displayName || username}</h4>
      </div>
    </div>;
  }

  getPath(): string {
    return `users/${this.props.user.id}`;
  }
}

interface IUserSearchResultProps {
  user: IUserRecord;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export class HubSearchResults extends React.Component<IHubSearchResultsProps, IHubSearchResultsState> {
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

    return <div className={classNames("hub-search-results", {active: open})}>
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
    </div>;
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
        items.push(<SearchResult key={`game-${game.id}`} game={game}
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
        items.push(<SearchResult key={`game-${gameId}`} game={game}
          chosen={index++ === highlight} active={active}
          onClick={() => { navigateToGame(game); closeSearch({}); }}/>);
      });
    }

    return <div className="result-list">
      {items}
    </div>;
  }
}

interface IHubSearchResultsProps {
  search: ISessionSearchState;
  allGames: IGameRecord[];

  t: ILocalizer;

  closeSearch: typeof actions.closeSearch;
  navigate: typeof actions.navigate;
  navigateToGame: typeof actions.navigateToGame;
  navigateToUser: typeof actions.navigateToUser;
}

interface IHubSearchResultsState {
  chosen: number;
}

const mapStateToProps = createStructuredSelector({
  search: (state: IState) => state.session.search,
  allGames: createSelector(
    (state: IState) => ((state.market || {games: null}).games || {}),
    (games) => values(games),
  ),
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  closeSearch: dispatcher(dispatch, actions.closeSearch),
  navigate: dispatcher(dispatch, actions.navigate),
  navigateToGame: dispatcher(dispatch, actions.navigateToGame),
  navigateToUser: dispatcher(dispatch, actions.navigateToUser),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubSearchResults);
