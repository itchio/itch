
import * as React from "react";
import {createStructuredSelector} from "reselect";

import {connect} from "./connect";

import {ILocalizer} from "../localizer";

import {IState, IGameRecord} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import * as actions from "../actions";

import {AutoSizer, Table, Column} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";

interface IRowGetterParams {
  index: number;
}

class GameTable extends React.Component<IGameTableProps, void> {
  constructor() {
    super();
    this.rowGetter = this.rowGetter.bind(this);
  }

  rowGetter (params: IRowGetterParams): any {
    const {index} = params;
    return this.props.games[index];
  }

  render () {
    const {t, games} = this.props;

    return <AutoSizer>
      {({width, height}: IAutoSizerParams) => (
        <Table
            headerHeight={40}
            height={height}
            width={width}
            rowCount={games.length}
            rowHeight={40}
            rowGetter={this.rowGetter}
          >
          <Column dataKey="title" label={t("table.column.name")} width={width * .5}/>
          <Column dataKey="publishedAt" label={t("table.column.published")} width={width * .5}/>
        </Table>
      )}
    </AutoSizer>;
  }
}

interface IGameTableProps {
  // specified
  games: IGameRecord[];
  tab: string;

  filterQuery: string;
  onlyCompatible: boolean;

  t: ILocalizer;

  clearFilters: typeof actions.clearFilters;
}

const mapStateToProps = (initialState: IState, props: IGameTableProps) => {
  const {tab} = props;

  return createStructuredSelector({
    filterQuery: (state: IState) => state.session.navigation.filters[tab],
    onlyCompatible: (state: IState) => state.session.navigation.binaryFilters.onlyCompatible,
  });
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  clearFilters: dispatcher(dispatch, actions.clearFilters),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameTable);
