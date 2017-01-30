
import * as React from "react";
import {connect} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import * as actions from "../actions";
import urls from "../constants/urls";

import Icon from "./icon";
import Games from "./games";
import GameFilters from "./game-filters";

import {map, filter} from "underscore";
import {pathToId} from "../util/navigation";

import {
  IState, IGameRecordSet, ICollectionRecord, ICollectionRecordSet, ITabData,
  IUserMarketState, IGlobalMarketState,
} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

export class Collection extends React.Component<ICollectionProps, void> {
  render () {
    const {t, allGames, tabGames, tabPath, collection, initiateShare} = this.props;

    if (!collection) {
      return <div className="collection-meat">
        Loading...
      </div>;
    }

    const {gameIds} = collection;
    const games = filter(map(gameIds, (gameId) => tabGames[gameId] || allGames[gameId]), (x) => !!x);

    const tab = tabPath;

    return <div className="collection-meat">
      <GameFilters tab={tab}>
        <span className="link-icon" onClick={(e) => initiateShare({url: `${urls.itchio}/c/${collection.id}/x`})}>
          <Icon icon="share"/>
        </span>
      </GameFilters>

      {games.length > 0
        ? <Games games={games} tab={tab}/>
        : <p className="empty">{t("collection.empty")}</p>
      }
    </div>;
  }
}

interface ICollectionProps {
  tabPath: string;
  tabId: string;

  allGames: IGameRecordSet;
  tabGames: IGameRecordSet;
  collection: ICollectionRecord;

  t: ILocalizer;

  initiateShare: typeof actions.initiateShare;
}

interface IStructuredSelectorResult {
  collectionId: number;
  userMarket: IUserMarketState;
  globalMarket: IGlobalMarketState;
  tabData: ITabData;
}

interface ICollectionsContainer {
  collections?: ICollectionRecordSet;
}

const mapStateToProps = () => {
  const marketSelector = createStructuredSelector({
    collectionId: (state: IState, props: ICollectionProps) => +pathToId(props.tabPath),
    userMarket: (state: IState, props: ICollectionProps) => state.market,
    globalMarket: (state: IState, props: ICollectionProps) => state.globalMarket,
    tabData: (state: IState, props: ICollectionProps) => state.session.navigation.tabData[props.tabId] || {},
  });

  return createSelector(
    marketSelector,
    (cs: IStructuredSelectorResult) => {
      const allGames = (cs.userMarket || {} as IUserMarketState).games || {};
      const tabGames = cs.tabData.games || {};
      const getCollection = (market: ICollectionsContainer) => {
        return ((market || {}).collections || {})[cs.collectionId] || {};
      };
      const collection = getCollection(cs.tabData) || getCollection(cs.userMarket);
      return {collection, allGames, tabGames};
    },
  );
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  initiateShare: dispatcher(dispatch, actions.initiateShare),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Collection);
