import * as React from "react";
import { InjectedIntl, injectIntl } from "react-intl";
import { createSelector, createStructuredSelector } from "reselect";
import { connect } from "../connect";
import { values, findWhere } from "underscore";

import { IGameSet, IAppState, ITabData } from "../../types/index";
import { ICollection } from "../../db/models/collection";
import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";

import { GridContainerDiv, GridDiv } from "./grid-styles";
import CollectionRow from "./row";
import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";
import { whenClickNavigates } from "../when-click-navigates";

const tab = "collections";
const emptyObj = {};

const rowHeight = 220;
const interiorPadding = 10;
const globalPadding = 20;

// TODO:
// change to work from `collectionIds` so we can
// maintain the API order

class Grid extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { collections } = this.props;

    const numCollections = collections.length;
    const contentHeight = numCollections * rowHeight;

    const sizes = { rowHeight, globalPadding };

    return (
      <GridContainerDiv sizes={sizes}>
        <GridDiv
          innerRef={this.props.divRef}
          onClick={this.onClick}
          onContextMenu={this.onContextMenu}
        >
          <div
            style={{
              position: "absolute",
              width: "1px",
              height: `${contentHeight}px`,
            }}
          />
          {this.renderCollections()}
        </GridDiv>
      </GridContainerDiv>
    );
  }

  eventToCollection(
    ev: React.MouseEvent<HTMLElement>,
    cb: (collection: ICollection) => void,
  ) {
    let target = ev.target as HTMLElement;
    while (target && !target.classList.contains("grid--row")) {
      target = target.parentElement;
    }
    if (!target) {
      return;
    }

    const collectionId = target.attributes.getNamedItem("data-collection-id");
    if (collectionId) {
      const { collections } = this.props;
      const collection = findWhere(collections, {
        id: +collectionId.value,
      });
      if (collection) {
        cb(collection);
      }
    }
  }

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    whenClickNavigates(ev, ({ background }) => {
      this.eventToCollection(ev, collection => {
        const { navigateToCollection } = this.props;
        navigateToCollection({ collection, background });
      });
    });
  };

  onContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    // nothing so far
  };

  renderCollections(): JSX.Element[] {
    const { collections, games, scrollTop, height } = this.props;

    const overscan = 1;
    const outerRowHeight = rowHeight + interiorPadding;
    const numVisibleRows = height / outerRowHeight;
    let startRow = Math.floor(scrollTop / outerRowHeight);
    let endRow = Math.ceil(startRow + numVisibleRows + 1);

    startRow = Math.max(0, startRow - overscan);
    endRow = Math.min(collections.length, endRow + overscan);

    return collections.slice(startRow, endRow).map((collection, index) => {
      return (
        <CollectionRow
          key={collection.id}
          collection={collection}
          allGames={games}
          index={index + startRow}
          interiorPadding={interiorPadding}
          globalPadding={globalPadding}
          rowHeight={rowHeight}
        />
      );
    });
  }
}

interface IProps extends IDimensionsProps {}

interface IDerivedProps {
  games: IGameSet;
  collections: ICollection[];
  hiddenCount: number;
  intl: InjectedIntl;

  navigateToCollection: typeof actions.navigateToCollection;
}

export default connect<IProps>(injectIntl(injectDimensions(Grid)), {
  state: createSelector(
    (state: IAppState) => state.session.tabData[tab] || emptyObj,
    createStructuredSelector({
      games: (tabData: ITabData) => tabData.games || emptyObj,
      collections: (tabData: ITabData) =>
        values(tabData.collections || emptyObj),
      hiddenCount: (tabData: ITabData) => 0,
    }),
  ),
  dispatch: dispatch => ({
    navigateToCollection: dispatcher(dispatch, actions.navigateToCollection),
  }),
});
