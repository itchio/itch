import * as React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import format from "./format";

import { map, first, rest } from "underscore";
import * as actions from "../actions";

import DownloadRow from "./download-row";
import TitleBar from "./title-bar";

import { IAppState, IDownloadItem } from "../types";
import { dispatcher } from "../constants/action-types";

import {
  getPendingDownloads,
  getFinishedDownloads,
} from "../reactors/downloads/getters";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";
import { injectIntl, InjectedIntl } from "react-intl";

const DownloadsDiv = styled.div`${styles.meat()};`;

const DownloadsContentDiv = styled.div`
  overflow-y: auto;
  padding: 0 20px 20px 20px;

  .section-bar {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    align-content: center;
    margin: 20px 0 10px 10px;
    flex-shrink: 0;

    h2 {
      font-size: 22px;
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
        <DownloadsContentDiv>
          {this.renderContents()}
        </DownloadsContentDiv>
      </DownloadsDiv>
    );
  }

  renderContents() {
    const { items, finishedItems, intl } = this.props;
    const { clearFinishedDownloads } = this.props;

    const hasItems = items.length + finishedItems.length > 0;
    if (!hasItems) {
      return (
        <EmptyState>
          {format(["status.downloads.no_active_downloads"])}
        </EmptyState>
      );
    }

    const firstItem = first(items);
    const queuedItems = rest(items);

    return (
      <DownloadsContentDiv>
        {firstItem
          ? <div className="section-bar">
              <h2>
                {format(["status.downloads.category.active"])}
              </h2>
            </div>
          : ""}

        {firstItem
          ? <DownloadRow key={firstItem.id} item={firstItem} first active />
          : ""}

        {queuedItems.length > 0
          ? <div className="section-bar">
              <h2>
                {format(["status.downloads.category.queued"])}
              </h2>
            </div>
          : ""}
        {queuedItems.length > 0
          ? map(queuedItems, (item, i) =>
              <DownloadRow key={item.id} item={item} active />,
            )
          : ""}

        {finishedItems.length > 0
          ? [
              <div className="section-bar">
                <h2 className="finished-header">
                  {format(["status.downloads.category.finished"])}
                </h2>
                <span
                  className="clear"
                  data-rh-at="right"
                  data-rh={intl.formatMessage({
                    id: "status.downloads.clear_all_finished",
                  })}
                  onClick={() => clearFinishedDownloads({})}
                >
                  <span className="icon icon-delete" />
                </span>
              </div>,
            ].concat(
              map(finishedItems, item =>
                <DownloadRow key={item.id} item={item} />,
              ),
            )
          : ""}
      </DownloadsContentDiv>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  items: IDownloadItem[];
  finishedItems: IDownloadItem[];

  clearFinishedDownloads: typeof actions.clearFinishedDownloads;
  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Downloads), {
  state: createStructuredSelector({
    items: (state: IAppState) => getPendingDownloads(state.downloads),
    finishedItems: (state: IAppState) => getFinishedDownloads(state.downloads),
  }),
  dispatch: dispatch => ({
    clearFinishedDownloads: dispatcher(
      dispatch,
      actions.clearFinishedDownloads,
    ),
  }),
});
