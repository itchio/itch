
import * as React from "react";
import {createStructuredSelector} from "reselect";

import {connect} from "./connect";

import {map, each, filter} from "underscore";

import doesEventMeanBackground from "./does-event-mean-background";

import * as actions from "../actions";

import {IState, ICollectionRecord, IGameRecord, IGameRecordSet, IUserMarketState} from "../types";
import {IAction, dispatcher} from "../constants/action-types";

export class CollectionHubItem extends React.Component<ICollectionHubItemProps, void> {
  render () {
    const {allGames, collection} = this.props;
    const {navigateToCollection} = this.props;
    const {title} = collection;

    const gameIds = (collection.gameIds || []).slice(0, 4);
    const games = filter(map(gameIds, (gameId) => allGames[gameId]), (x) => !!x);
    while (games.length < 4) {
      games.push({} as IGameRecord);
    }

    const gameItems = map(games, (game) => {
      const style: React.CSSProperties = {};
      const coverUrl = game.stillCoverUrl || game.coverUrl;
      if (coverUrl) {
        style.backgroundImage = `url('${coverUrl}')`;
      }
      return <div className="cover" style={style}></div>;
    });

    const rows: JSX.Element[] = [];
    let cols: JSX.Element[] = [];
    each(gameItems, (item, i) => {
      cols.push(item);

      if (i % 2 === 1) {
        const row = <div className="row">{cols}</div>;
        rows.push(row);
        cols = [];
      }
    });

    return <div className="hub-item collection-hub-item"
        onClick={(e) => navigateToCollection(collection, doesEventMeanBackground(e))}>
      <section className="title">
        {title} ({(collection.gameIds || []).length})
      </section>
      <section className="fresco">
        {rows}
      </section>
    </div>;
  }
}

interface ICollectionHubItemProps {
  // specified
  collection: ICollectionRecord;

  // derived
  allGames: IGameRecordSet;

  navigateToCollection: typeof actions.navigateToCollection;
}

const mapStateToProps = createStructuredSelector({
  allGames: (state: IState) => (state.market || {} as IUserMarketState).games || {},
});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  navigateToCollection: dispatcher(dispatch, actions.navigateToCollection),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CollectionHubItem);
