
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import * as actions from "../actions";
import urls from "../constants/urls";

import Icon from "./basics/icon";
import Games from "./games";
import GameFilters from "./game-filters";

import {map, filter} from "underscore";
import {pathToId} from "../util/navigation";

import {
  IAppState, IGameRecordSet, ICollectionRecord, ICollectionRecordSet, ITabData,
} from "../types";
import {dispatcher} from "../constants/action-types";

import styled, * as styles from "./styles";

const CollectionDiv = styled.div`
  ${styles.meat()}
`;

const Empty = styled.p`
  ${styles.emptyMeat()}
`;

export class Collection extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, allGames, tabGames, tabPath, collection, initiateShare} = this.props;

    if (!collection) {
      return <CollectionDiv>
        Loading...
      </CollectionDiv>;
    }

    const {gameIds} = collection;
    const games = filter(map(gameIds, (gameId) => tabGames[gameId] || allGames[gameId]), (x) => !!x);

    const tab = tabPath;

    return <CollectionDiv>
      <GameFilters tab={tab}>
        <span className="link-icon" onClick={(e) => initiateShare({url: `${urls.itchio}/c/${collection.id}/x`})}>
          <Icon icon="share"/>
        </span>
      </GameFilters>

      {games.length > 0
        ? <Games games={games} tab={tab}/>
        : <Empty>{t("collection.empty")}</Empty>
      }
    </CollectionDiv>;
  }
}

interface IProps {
  tabPath: string;
  tabId: string;
}

interface IDerivedProps {
  allGames: IGameRecordSet;
  tabGames: IGameRecordSet;
  collection: ICollectionRecord;

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

export default connect<IProps>(Collection, {
  state: () => {
    const marketSelector = createStructuredSelector({
      collectionId: (state: IAppState, props: IProps) => +pathToId(props.tabPath),
      userMarket: (state: IAppState, props: IProps) => state.market,
      globalMarket: (state: IAppState, props: IProps) => state.globalMarket,
      tabData: (state: IAppState, props: IProps) => state.session.navigation.tabData[props.tabId] || {},
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
        return { collection, allGames, tabGames };
      },
    );
  },
  dispatch: (dispatch) => ({
    initiateShare: dispatcher(dispatch, actions.initiateShare),
  }),
});
