import * as React from "react";

import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";

const CollectionDiv = styled.div`${styles.meat()};`;

export default class Collection extends React.PureComponent<IProps> {
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
