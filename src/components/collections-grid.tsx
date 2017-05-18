
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import CollectionRow from "./collection-row";

import {IAppState, ICollectionRecord, ICollectionRecordSet, ITabData, IGameRecordSet} from "../types";

import {AutoSizer, Grid} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";

import {values} from "underscore";

import styled from "./styles";

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

interface ILayoutInfo {
  columnCount: number;
  collections: ICollectionRecord[];
}

const tab = "collections";

const HubCollectionsGrid = styled.div`
  flex-grow: 1;
`;

const StyledGrid = styled(Grid)`
  outline: none;
`;

export class CollectionsGrid extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      scrollTop: 0,
    };
    this.cellRenderer = this.cellRenderer.bind(this);
  }

  render () {
    const {t, hiddenCount} = this.props;
    const collections = values(this.props.collections);

    return <HubCollectionsGrid>
        <AutoSizer>
        {({width, height}: IAutoSizerParams) => {
          const columnCount = 1;
          const rowCount = Math.ceil(collections.length / columnCount);
          const columnWidth = ((width - 10) / columnCount);
          const rowHeight = 260;
          const scrollTop = height === 0 ? 0 : this.state.scrollTop;

          return <StyledGrid
            ref="grid"
            cellRenderer={this.cellRenderer.bind(this, {collections, columnCount})}
            width={width}
            height={height}
            columnWidth={columnWidth}
            columnCount={columnCount}
            rowCount={rowCount}
            rowHeight={rowHeight}
            overscanRowCount={2}
            onScroll={(e: any) => {
              // ignore when tab's hidden
              if (e.clientHeight === 0) { return; }
              this.setState({scrollTop: e.scrollTop});
            }}
            scrollTop={scrollTop}
            scrollPositionChangeReason="requested"
          />;
        }}
        </AutoSizer>
        {hiddenCount > 0
        ? <div className="hidden-count">
          {t("grid.hidden_count", {count: hiddenCount})}
        </div>
    : ""}
    </HubCollectionsGrid>;
  }

  cellRenderer(layout: ILayoutInfo, cell: ICellInfo): JSX.Element {
    const games = this.props.games;
    const collectionIndex = (cell.rowIndex * layout.columnCount) + cell.columnIndex;
    const record = layout.collections[collectionIndex];

    const style = cell.style;
    style.padding = "10px";
    if (cell.columnIndex < layout.columnCount - 1) {
      style.marginRight = "10px";
    }

    return <div key={cell.key} style={cell.style}>
      {
        record
        ? <CollectionRow key={record.id} collection={record} allGames={games}/>
        : null
      }
    </div>;
  }
}

interface IProps {}

interface IDerivedProps {
  games: IGameRecordSet;
  collections: ICollectionRecordSet;
  hiddenCount: number;
}

interface IState {
  scrollTop?: number;
}

const emptyObj = {};

export default connect<IProps>(CollectionsGrid, {
  state: createSelector(
    (state: IAppState) => state.session.tabData[tab] || emptyObj,
    createStructuredSelector({
      games: (tabData: ITabData) => tabData.games || emptyObj,
      collections: (tabData: ITabData) => tabData.collections || emptyObj,
      hiddenCount: (tabData: ITabData) => 0,
    }),
  ),
});
