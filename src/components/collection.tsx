import * as React from "react";

import Games from "./games";
import GameFilters from "./game-filters";
import TitleBar from "./title-bar";
import IconButton from "./basics/icon-button";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";
import { connect } from "./connect";

import * as actions from "../actions";
import { dispatcher } from "../constants/action-types";

const CollectionDiv = styled.div`${styles.meat()};`;

export class Collection extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab } = this.props;

    return (
      <CollectionDiv>
        <TitleBar tab={tab} />
        <GameFilters tab={tab}>
          <IconButton icon="repeat" onClick={this.onRepeat} />
        </GameFilters>
        <Games tab={tab} />
      </CollectionDiv>
    );
  }

  onRepeat = () => {
    this.props.tabReloaded({ tab: this.props.tab });
  };
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  tabReloaded: typeof actions.tabReloaded;
}

export default connect<IProps>(Collection, {
  dispatch: dispatch => ({
    tabReloaded: dispatcher(dispatch, actions.tabReloaded),
  }),
});
