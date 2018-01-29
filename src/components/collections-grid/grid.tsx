import * as React from "react";
import { InjectedIntl, injectIntl } from "react-intl";
import { createSelector, createStructuredSelector } from "reselect";
import { connect } from "../connect";
import { findWhere } from "underscore";

import {
  IGameSet,
  IRootState,
  ITabData,
  ICollectionSet,
} from "../../types/index";
import { ICollection } from "../../db/models/collection";
import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";

import { GridContainerDiv, GridDiv } from "./grid-styles";
import CollectionRow from "./row";
import { actions, dispatcher } from "../../actions";
import { whenClickNavigates } from "../when-click-navigates";
import HiddenIndicator from "../hidden-indicator";

const tab = "collections";
const eo: any = {};
const ea = [] as any[];

const rowHeight = 240;
const frescoHeight = 140;
const interiorPadding = 20;
const globalPadding = 20;

class Grid extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { collectionIds } = this.props;
    const hiddenCount = 0;

    const numCollections = collectionIds.length;
    const contentHeight = numCollections * rowHeight;

    const sizes = { rowHeight, frescoHeight, globalPadding };

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
        <HiddenIndicator tab={tab} count={hiddenCount} />
      </GridContainerDiv>
    );
  }

  eventToCollection(
    ev: React.MouseEvent<HTMLElement>,
    cb: (collection: ICollection) => void
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
    const { collectionIds, collections, games, scrollTop, height } = this.props;

    const overscan = 1;
    const outerRowHeight = rowHeight + interiorPadding;
    const numVisibleRows = height / outerRowHeight;
    let startRow = Math.floor(scrollTop / outerRowHeight);
    let endRow = Math.ceil(startRow + numVisibleRows + 1);

    startRow = Math.max(0, startRow - overscan);
    endRow = Math.min(collectionIds.length, endRow + overscan);

    return collectionIds.slice(startRow, endRow).map((id, index) => {
      const collection = collections[id];
      if (!collection) {
        return null;
      }

      return (
        <CollectionRow
          key={id}
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
  collectionIds: number[];
  collections: ICollectionSet;
  intl: InjectedIntl;

  navigateToCollection: typeof actions.navigateToCollection;
}

export default connect<IProps>(injectIntl(injectDimensions(Grid)), {
  state: createSelector(
    (rs: IRootState) => rs.session.tabData[tab] || eo,
    createStructuredSelector({
      games: (tabData: ITabData) => (tabData.games || eo).set || eo,
      collectionIds: (tabData: ITabData) =>
        (tabData.collections || eo).ids || ea,
      collections: (tabData: ITabData) => (tabData.collections || eo).set || eo,
    })
  ),
  dispatch: dispatch => ({
    navigateToCollection: dispatcher(dispatch, actions.navigateToCollection),
  }),
});
