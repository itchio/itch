
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import Games from "./games";
import GameFilters from "./game-filters";

import {map, filter} from "underscore";
import {pathToId} from "../util/navigation";

import {
  IAppState, IGameRecordSet, ICollectionRecord, ICollectionRecordSet, ITabData,
} from "../types";

import styled, * as styles from "./styles";

const CollectionDiv = styled.div`
  ${styles.meat()}
`;

const Empty = styled.p`
  ${styles.emptyMeat()}
`;

export class Collection extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, tabGames, tabPath, collection} = this.props;

    if (!collection) {
      return <CollectionDiv>
        Loading...
      </CollectionDiv>;
    }

    const {gameIds} = collection;
    const games = filter(map(gameIds, (gameId) => tabGames[gameId]), (x) => !!x);

    const tab = tabPath;

    return <CollectionDiv>
      <GameFilters tab={tab}>
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
  tabGames: IGameRecordSet;
  collection: ICollectionRecord;
}

interface IStructuredSelectorResult {
  collectionId: number;
  tabData: ITabData;
}

interface ICollectionsContainer {
  collections?: ICollectionRecordSet;
}

export default connect<IProps>(Collection, {
  state: () => {
    const marketSelector = createStructuredSelector({
      collectionId: (state: IAppState, props: IProps) => +pathToId(props.tabPath),
      tabData: (state: IAppState, props: IProps) => state.session.navigation.tabData[props.tabId] || {},
    });

    return createSelector(
      marketSelector,
      (cs: IStructuredSelectorResult) => {
        const tabGames = cs.tabData.games || {};
        const getCollection = (market: ICollectionsContainer) => {
          return ((market || {}).collections || {})[cs.collectionId] || {};
        };
        const collection = getCollection(cs.tabData);
        return { collection, tabGames };
      },
    );
  },
});
