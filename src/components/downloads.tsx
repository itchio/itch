import * as React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import format from "./format";

import { map, first, rest } from "underscore";
import * as actions from "../actions";

import Link from "./basics/link";
import Row from "./download/row";
import TitleBar from "./title-bar";

import { IRootState, IDownloadItem } from "../types";
import { dispatcher } from "../constants/action-types";

import {
  getPendingDownloads,
  getFinishedDownloads,
} from "../reactors/downloads/getters";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";

const DownloadsDiv = styled.div`${styles.meat()};`;

const DownloadsContentDiv = styled.div`
  overflow-y: auto;
  padding: 0 20px 20px 10px;

  .section-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 20px 0 20px 10px;
    flex-shrink: 0;

    h2 {
      font-size: 22px;
      margin-right: 1em;
    }

    .clear {
      margin-left: 8px;
      ${styles.clickable()};
    }
  }

  .game-actions .main-action {
    padding: 3px 10px;
  }
`;

const EmptyState = styled.div`
  font-size: ${props => props.theme.fontSizes.large};
  color: ${props => props.theme.secondaryText};

  margin: 20px;
`;

class Downloads extends React.PureComponent<IProps & IDerivedProps> {
  constructor() {
    super();
  }

  render() {
    const { tab } = this.props;

    return (
      <DownloadsDiv>
        <TitleBar tab={tab} />
        <DownloadsContentDiv>{this.renderContents()}</DownloadsContentDiv>
      </DownloadsDiv>
    );
  }

  renderContents() {
    const { items, finishedItems } = this.props;
    const { clearFinishedDownloads } = this.props;

    const hasItems = items.length + finishedItems.length > 0;
    if (!hasItems) {
      return (
        <EmptyState className="no-active-downloads">
          {format(["status.downloads.no_active_downloads"])}
        </EmptyState>
      );
    }

    const firstItem = first(items);
    const queuedItems = rest(items);

    return (
      <DownloadsContentDiv>
        {firstItem ? (
          <div className="section-bar">
            <h2>{format(["status.downloads.category.active"])}</h2>
          </div>
        ) : (
          ""
        )}

        {firstItem ? <Row key={firstItem.id} item={firstItem} first /> : ""}

        {queuedItems.length > 0 ? (
          <div className="section-bar">
            <h2>{format(["status.downloads.category.queued"])}</h2>
          </div>
        ) : (
          ""
        )}
        {queuedItems.length > 0 ? (
          map(queuedItems, (item, i) => <Row key={item.id} item={item} />)
        ) : (
          ""
        )}

        {finishedItems.length > 0 ? (
          [
            <div key="finished-header" className="section-bar">
              <h2 className="finished-header">
                {format(["status.downloads.category.recent_activity"])}
              </h2>
              <Link
                className="downloads-clear-all"
                onClick={() => clearFinishedDownloads({})}
              >
                {format(["status.downloads.clear_all_finished"])}
              </Link>
            </div>,
          ].concat(
            map(finishedItems, item => (
              <Row key={item.id} item={item} finished />
            ))
          )
        ) : (
          ""
        )}
      </DownloadsContentDiv>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  items: IDownloadItem[];
  finishedItems: IDownloadItem[];

  clearFinishedDownloads: typeof actions.clearFinishedDownloads;
}

export default connect<IProps>(Downloads, {
  state: createStructuredSelector({
    items: (rs: IRootState) => getPendingDownloads(rs.downloads),
    finishedItems: (rs: IRootState) => getFinishedDownloads(rs.downloads),
  }),
  dispatch: dispatch => ({
    clearFinishedDownloads: dispatcher(
      dispatch,
      actions.clearFinishedDownloads
    ),
  }),
});
