import * as React from "react";
import { createSelector, createStructuredSelector } from "reselect";
import { connect, Dispatchers, actionCreatorsList } from "../connect";
import { findWhere, isEmpty } from "underscore";

import { IRootState, ICollectionSet } from "../../types/index";
import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";

import { GridContainerDiv, GridDiv } from "./grid-styles";
import CollectionRow from "./row";
import { whenClickNavigates } from "../when-click-navigates";
import HiddenIndicator from "../hidden-indicator";
import EmptyState from "../empty-state";
import LoadingState from "../loading-state";
import { Space } from "../../helpers/space";
import { collectionEvolvePayload } from "../../util/navigation";
import { Collection } from "../../buse/messages";

const tab = "itch://collections";
const eo: any = {};
const ea = [] as any[];

const rowHeight = 240;
const frescoHeight = 140;
const interiorPadding = 20;
const globalPadding = 20;

class Grid extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { collectionIds, navigate, loading } = this.props;
    const hiddenCount = 0;

    const numCollections = collectionIds.length;
    const contentHeight =
      numCollections > 0 ? `${numCollections * rowHeight}px` : "100%";

    const sizes = { rowHeight, frescoHeight, globalPadding };

    if (isEmpty(collectionIds)) {
      if (loading) {
        return <LoadingState />;
      }

      return (
        <EmptyState
          icon="tag"
          bigText={["collections.empty"]}
          smallText={["collections.empty_sub"]}
          buttonIcon="earth"
          buttonText={["status.downloads.find_games_button"]}
          buttonAction={() => navigate({ url: "itch://featured" })}
        />
      );
    }

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
              height: contentHeight,
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
    cb: (collection: Collection) => void
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
        this.props.navigateTab({
          tab,
          background,
          ...collectionEvolvePayload(collection),
        });
      });
    });
  };

  onContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    // nothing so far
  };

  renderCollections(): JSX.Element[] {
    const { collectionIds, collections, scrollTop, height } = this.props;

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

const actionCreators = actionCreatorsList("navigateTab", "navigate");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  collectionIds: number[];
  collections: ICollectionSet;
  loading: boolean;
};

export default connect<IProps>(injectDimensions(Grid), {
  state: createSelector(
    (rs: IRootState) => Space.fromInstance(rs.profile.tabInstances[tab]),
    (rs: IRootState) => rs.profile.navigation.loadingTabs[tab],
    createStructuredSelector({
      collectionIds: (sp: Space) => sp.collections().ids || ea,
      collections: (sp: Space) => sp.collections().set || eo,
      loading: (sp: Space, loading: boolean) => loading || sp.isSleepy(),
    })
  ),
  actionCreators,
});
