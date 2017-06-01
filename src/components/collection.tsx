
import * as React from "react";
import {connect, I18nProps} from "./connect";

import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";

import {IMeatProps} from "./meats/types";

import {
  IGameRecordSet, ICollectionRecord,
} from "../types";

import styled, * as styles from "./styles";

const CollectionDiv = styled.div`
  ${styles.meat()}
`;

export class Collection extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {tab} = this.props;

    return <CollectionDiv>
      <TitleBar tab={tab}/>
      <GameFilters tab={tab}/>
      <Games tab={tab}/>
    </CollectionDiv>;
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  tabGames: IGameRecordSet;
  collection: ICollectionRecord;
}
export default connect<IProps>(Collection);
