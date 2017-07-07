import * as React from "react";
import { connect, I18nProps } from "./connect";

import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";

import { IMeatProps } from "./meats/types";

import { ICollection } from "../db/models/collection";
import { IGameSet } from "../types";

import styled, * as styles from "./styles";

const CollectionDiv = styled.div`${styles.meat()};`;

export class Collection extends React.PureComponent<
  IProps & IDerivedProps & I18nProps
> {
  render() {
    const { tab } = this.props;

    return (
      <CollectionDiv>
        <TitleBar tab={tab} />
        <GameFilters tab={tab} />
        <Games tab={tab} />
      </CollectionDiv>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  tabGames: IGameSet;
  collection: ICollection;
}
export default connect<IProps>(Collection);
