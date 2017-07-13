import * as React from "react";
import { connect } from "./connect";

import urls from "../constants/urls";
import * as actions from "../actions";

// TODO: GameFilters doesn't belong in Collections view
import GameFilters from "./game-filters";

import { IMeatProps } from "./meats/types";

import { dispatcher } from "../constants/action-types";

import CollectionsGrid from "./collections-grid";
import Link from "./basics/link";
import TitleBar from "./title-bar";

import styled, * as styles from "./styles";
import { injectIntl, InjectedIntl } from "react-intl";

const CollectionsContainer = styled.div`${styles.meat()};`;

const tab = "collections";

export class Collections extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl, navigate } = this.props;

    return (
      <CollectionsContainer>
        <TitleBar tab={tab} />
        <GameFilters
          tab={tab}
          showBinaryFilters={false}
          showLayoutPicker={false}
        >
          <Link
            label={intl.formatMessage({ id: "outlinks.manage_collections" })}
            onClick={e => navigate(`url/${urls.myCollections}`)}
          />
        </GameFilters>
        <CollectionsGrid />
      </CollectionsContainer>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  navigate: typeof actions.navigate;
  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Collections), {
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
