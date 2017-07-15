
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import {map, first, rest} from "underscore";
import * as actions from "../actions";

import DownloadRow from "./download-row";

import {IState, IDownloadItem} from "../types";
import {IDispatch, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

class Downloads extends React.Component<IDownloadsProps> {
  constructor () {
    super();
  }

  render () {
    const {t, items, finishedItems} = this.props;
    const {clearFinishedDownloads} = this.props;

    const hasItems = (items.length + finishedItems.length) > 0;
    if (!hasItems) {
      return <p className="empty">
          {t("status.downloads.no_active_downloads")}
      </p>;
    }

    const firstItem = first(items);
    const queuedItems = rest(items);

    return <ul className="downloads-page">
    {firstItem
    ? <div className="section-bar">
      <h2>{t("status.downloads.category.active")}</h2>
    </div>
    : ""}

    {firstItem
    ? <DownloadRow key={firstItem.id} item={firstItem} first active/>
    : ""}

    {queuedItems.length > 0
    ? <div className="section-bar">
      <h2>{t("status.downloads.category.queued")}</h2>
    </div>
    : ""}
    {queuedItems.length > 0
    ? map(queuedItems, (item, i) =>
      <DownloadRow key={item.id} item={item} active/>,
    )
    : ""}

    {finishedItems.length > 0
      ? [
        <div className="section-bar">
          <h2 className="finished-header">
            {t("status.downloads.category.finished")}
          </h2>
          <span className="clear" data-rh-at="right" data-rh={t("status.downloads.clear_all_finished")}
              onClick={() => clearFinishedDownloads({})}>
            <span className="icon icon-delete"/>
          </span>
        </div>,
      ].concat(map(finishedItems, (item) =>
        <DownloadRow key={item.id} item={item}/>,
      ))
      : ""}

    </ul>;
  }
}

interface IDownloadsProps {
  items: IDownloadItem[];
  finishedItems: IDownloadItem[];

  t: ILocalizer;

  clearFinishedDownloads: typeof actions.clearFinishedDownloads;
}

const mapStateToProps = createStructuredSelector({
  items: (state: IState) => map(state.downloads.downloadsByOrder, (id) => state.downloads.downloads[id]),
  finishedItems: (state: IState) => map(state.downloads.finishedDownloads, (id) => state.downloads.downloads[id]),
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  clearFinishedDownloads: dispatcher(dispatch, actions.clearFinishedDownloads),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Downloads);
