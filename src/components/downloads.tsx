import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";
import { createStructuredSelector } from "reselect";

import format from "./format";

import { map, first, rest } from "underscore";

import Link from "./basics/link";
import Row from "./download/row";
import EmptyState from "./empty-state";

import { IRootState, IDownloadItem } from "../types";

import {
  getPendingDownloads,
  getFinishedDownloads,
} from "../reactors/downloads/getters";

import { IMeatProps } from "./meats/types";

import styled, * as styles from "./styles";

const DownloadsDiv = styled.div`
  ${styles.meat()};
`;

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

class Downloads extends React.PureComponent<IProps & IDerivedProps> {
  constructor() {
    super();
  }

  render() {
    return <DownloadsDiv>{this.renderContents()}</DownloadsDiv>;
  }

  renderContents() {
    const { items, finishedItems } = this.props;
    const { clearFinishedDownloads, navigate } = this.props;

    const hasItems = items.length + finishedItems.length > 0;
    if (!hasItems) {
      return (
        <EmptyState
          className="no-active-downloads"
          icon="download"
          bigText={["status.downloads.no_active_downloads"]}
          smallText={["status.downloads.no_active_downloads_subtext"]}
          buttonIcon="earth"
          buttonText={["status.downloads.find_games_button"]}
          buttonAction={() => navigate({ url: "itch://featured" })}
        />
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
        {queuedItems.length > 0
          ? map(queuedItems, (item, i) => <Row key={item.id} item={item} />)
          : ""}

        {finishedItems.length > 0
          ? [
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
          : ""}
      </DownloadsContentDiv>
    );
  }
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList("clearFinishedDownloads", "navigate");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  items: IDownloadItem[];
  finishedItems: IDownloadItem[];
};

export default connect<IProps>(Downloads, {
  state: createStructuredSelector({
    items: (rs: IRootState) => getPendingDownloads(rs.downloads),
    finishedItems: (rs: IRootState) => getFinishedDownloads(rs.downloads),
  }),
  actionCreators,
});
