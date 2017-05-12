
import * as React from "react";
import {connect, I18nProps} from "./connect";

import urls from "../constants/urls";
import * as actions from "../actions";

// TODO: GameFilters doesn't belong in Collections view
import GameFilters from "./game-filters";

import {dispatcher} from "../constants/action-types";

import CollectionsGrid from "./collections-grid";
import Link from "./basics/link";

import styled, * as styles from "./styles";

const CollectionsContainer = styled.div`
  ${styles.meat()}
`;

const tab = "collections";

export class Collections extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, navigate} = this.props;

    return <CollectionsContainer>
      <GameFilters tab={tab} showBinaryFilters={false} showLayoutPicker={false}>
        <Link
          label={t("outlinks.manage_collections")}
          onClick={(e) => navigate(`url/${urls.myCollections}`)}
        />
      </GameFilters>
      <CollectionsGrid/>
    </CollectionsContainer>;
  }
}

interface IProps {}

interface IDerivedProps {
  navigate: typeof actions.navigate;
}

export default connect<IProps>(Collections, {
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
  }),
});
