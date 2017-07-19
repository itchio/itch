import * as React from "react";
import { connect } from "./connect";
import { createSelector, createStructuredSelector } from "reselect";

import { ICollection } from "../db/models/collection";
import CollectionRow from "./collection-row";

import { IAppState, ITabData, IGameSet } from "../types";

import { AutoSizer } from "react-virtualized";

import { values } from "underscore";

import styled from "./styles";
import StyledGrid from "./styled-grid";
import { InjectedIntl, injectIntl } from "react-intl";

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

const tab = "collections";

const HubCollectionsGrid = styled.div`flex-grow: 1;`;

export class CollectionsGrid extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      scrollTop: 0,
    };
  }

  render() {
    const { intl, hiddenCount } = this.props;

    return (
      <HubCollectionsGrid>
        <AutoSizer>
          {size => this.renderWithSize(size)}
        </AutoSizer>
        {hiddenCount > 0
          ? <div className="hidden-count">
              {intl.formatMessage(
                { id: "grid.hidden_count" },
                { count: hiddenCount },
              )}
            </div>
          : ""}
      </HubCollectionsGrid>
    );
  }

  renderWithSize = ({ width, height }) => {
    const { collections } = this.props;
    const columnCount = 1;
    const rowCount = Math.ceil(collections.length / columnCount);
    const columnWidth = (width - 16) / columnCount;
    const rowHeight = 260;
    const scrollTop = height === 0 ? 0 : this.state.scrollTop;

    return (
      <StyledGrid
        ref="grid"
        cellRenderer={this.cellRenderer}
        width={width}
        height={height}
        columnWidth={columnWidth}
        columnCount={columnCount}
        rowCount={rowCount}
        rowHeight={rowHeight}
        overscanRowCount={2}
        onScroll={(e: any) => {
          // ignore when tab's hidden
          if (e.clientHeight === 0) {
            return;
          }
          this.setState({ scrollTop: e.scrollTop });
        }}
        scrollTop={scrollTop}
        scrollPositionChangeReason="requested"
      />
    );
  };

  cellRenderer = (cell: ICellInfo): JSX.Element => {
    const { collections } = this.props;
    const columnCount = 1;

    const games = this.props.games;
    const collectionIndex = cell.rowIndex * columnCount + cell.columnIndex;
    const record = collections[collectionIndex];

    const style = cell.style;
    style.padding = "10px";
    if (cell.columnIndex < columnCount - 1) {
      style.marginRight = "10px";
    }

    return (
      <div key={cell.key} style={cell.style}>
        {record
          ? <CollectionRow
              key={record.id}
              collection={record}
              allGames={games}
            />
          : null}
      </div>
    );
  };
}

interface IProps {}

interface IDerivedProps {
  games: IGameSet;
  collections: ICollection[];
  hiddenCount: number;
  intl: InjectedIntl;
}

interface IState {
  scrollTop?: number;
}

const emptyObj = {};

export default connect<IProps>(injectIntl(CollectionsGrid), {
  state: createSelector(
    (state: IAppState) => state.session.tabData[tab] || emptyObj,
    createStructuredSelector({
      games: (tabData: ITabData) => tabData.games || emptyObj,
      collections: (tabData: ITabData) =>
        values(tabData.collections || emptyObj),
      hiddenCount: (tabData: ITabData) => 0,
    }),
  ),
});
