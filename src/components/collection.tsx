
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import Games from "./games";
import GameFilters from "./game-filters";

import {IMeatProps} from "./meats/types";

import {pathToId} from "../util/navigation";

import {
  IAppState, IGameRecordSet, ICollectionRecord, ICollectionRecordSet, ITabData,
} from "../types";

import styled, * as styles from "./styles";

const CollectionDiv = styled.div`
  ${styles.meat()}
`;

export class Collection extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {tabGames, tabData, collection} = this.props;
    const tabPath = tabData.path;

    if (!collection) {
      return <CollectionDiv>
        Loading...
      </CollectionDiv>;
    }

    const tab = tabPath;

    return <CollectionDiv>
      <GameFilters tab={tab}>
      </GameFilters>

      <Games tab={tab}/>
    </CollectionDiv>;
  }
}

interface IProps extends IMeatProps {}

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

const emptyObj = {};

export default connect<IProps>(Collection, {
  state: () => {
    const marketSelector = createStructuredSelector({
      collectionId: (state: IAppState, props: IProps) => +pathToId(props.tabData.path),
      tabData: (state: IAppState, props: IProps) => props.tabData,
    });

    return createSelector(
      marketSelector,
      (cs: IStructuredSelectorResult) => {
        const tabGames = cs.tabData.games || emptyObj;
        const collection = (cs.tabData.collections || emptyObj)[cs.collectionId];
        return { collection, tabGames };
      },
    );
  },
});
