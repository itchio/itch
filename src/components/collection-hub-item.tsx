
import * as React from "react";
import {createStructuredSelector} from "reselect";

import {connect, I18nProps} from "./connect";

import {map, each, filter} from "underscore";

import {whenClickNavigates} from "./when-click-navigates";

import * as actions from "../actions";

import Icon from "./basics/icon";
import TimeAgo from "./basics/time-ago";
import Ink = require("react-ink");
import interleave from "./interleave";

import {IAppState, ICollectionRecord, IGameRecordSet} from "../types";
import {multiDispatcher} from "../constants/action-types";

export class Collection extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, allGames, collection} = this.props;
    const {title} = collection;

    const gameIds = (collection.gameIds || []).slice(0, 8);
    const games = filter(map(gameIds, (gameId) => allGames[gameId]), (x) => !!x);

    const gameItems = map(games, (game, index) => {
      const style: React.CSSProperties = {};
      const coverUrl = game.stillCoverUrl || game.coverUrl;
      if (coverUrl) {
        style.backgroundImage = `url('${coverUrl}')`;
      }
      return <div key={index} className="cover" style={style}></div>;
    });

    const cols: JSX.Element[] = [];
    each(gameItems, (item, i) => {
      cols.push(item);
    });

    const itemCount = (collection.gameIds || []).length;

    return <div className="hub-item collection-hub-item"
        onMouseDown={this.onMouseDown.bind(this)}>
      <section className="title">
        {title}
      </section>
      <section className="fresco">
        {cols}
      </section>
      <section className="info">
        <Icon icon="tag"/>
        <span className="total">{t("sidebar.collection.subtitle", {itemCount})}</span>
        <span className="spacer"/>
        <Icon icon="history"/>
        {interleave(t, "collection_grid.item.updated_at", {
          time_ago: <TimeAgo date={collection.updatedAt}/>,
        })}
      </section>
      <Ink/>
    </div>;
  }

  onMouseDown (e: React.MouseEvent<any>) {
    const {navigateToCollection, collection} = this.props;
    whenClickNavigates(e, ({background}) => {
      navigateToCollection(collection, background);
    });
  }
}

interface IProps {
  collection: ICollectionRecord;
}

interface IDerivedProps {
  allGames: IGameRecordSet;

  navigateToCollection: typeof actions.navigateToCollection;
}

export default connect<IProps>(Collection, {
  state: createStructuredSelector({
    allGames: (state: IAppState) => (state.market || {} as IUserMarketState).games || {},
  }),
  dispatch: (dispatch) => ({
    navigateToCollection: multiDispatcher(dispatch, actions.navigateToCollection),
  }),
});
