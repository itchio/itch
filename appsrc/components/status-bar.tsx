
import * as classNames from "classnames";
import * as React from "react";

import * as actions from "../actions";
import urls from "../constants/urls";

import Icon from "./icon";

import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import {IState, ISelfUpdateState, ILocalizedString} from "../types";
import {IDispatch, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends React.Component<IStatusBarProps, void> {
  constructor () {
    super();
  }

  render () {
    const {t, statusMessages, selfUpdate} = this.props;
    const {dismissStatus, dismissStatusMessage, applySelfUpdateRequest, showAvailableSelfUpdate} = this.props;
    let {error, uptodate, available, downloading, downloaded, checking} = selfUpdate;

    let children: JSX.Element[] = [];
    let active = true;
    let busy = false;
    let indev = false;

    let callback = (): any => null;

    if (statusMessages.length > 0) {
      callback = () => dismissStatusMessage({});
      children = [
        <Icon icon="heart-filled"/>,
        <span>{t.format(statusMessages[0])}</span>,
        <Icon icon="cross"/>,
      ];
    } else if (error) {
      callback = () => dismissStatus({});
      children = [
        <Icon icon="heart-broken"/>,
        <span>Update error: {error}</span>,
        <Icon icon="cross"/>,
      ];
    } else if (downloaded) {
      callback = () => applySelfUpdateRequest({});
      children = [
        <Icon icon="install"/>,
        <span>{t("status.downloaded")}</span>,
      ];
    } else if (downloading) {
      busy = true;
      children = [
        <Icon icon="download"/>,
        <span>{t("status.downloading")}</span>,
      ];
    } else if (available) {
      callback = () => showAvailableSelfUpdate({});
      children = [
        <Icon icon="earth"/>,
        <span>{t("status.available")}</span>,
      ];
    } else if (checking) {
      busy = true;
      children = [
        <Icon icon="stopwatch"/>,
        <span>{t("status.checking")}</span>,
      ];
    } else if (uptodate) {
      children = [
        <Icon icon="like"/>,
        <span>{t("status.uptodate")}</span>,
      ];
    } else {
      active = false;
    }

    if (urls.itchio !== urls.originalItchio) {
      children = [
        ...children,
        <span> </span>,
        <Icon icon="star"/>,
        <span>{urls.itchio}</span>,
      ];
      indev = true;
      active = true;
    }

    const classes = classNames("status-bar", {active, busy, indev});
    const selfUpdateClasses = classNames("self-update", {busy});

    const onClick = () => {
      if (callback) {
        callback();
      }
    };

    return <div className={classes}>
      <div className="filler"/>
      <div className={selfUpdateClasses} onClick={onClick}>
        {children}
      </div>
      <div className="filler"/>
    </div>;
  }
}

interface IStatusBarProps {
  selfUpdate: ISelfUpdateState;
  statusMessages: ILocalizedString[];

  t: ILocalizer;

  applySelfUpdateRequest: typeof actions.applySelfUpdateRequest;
  showAvailableSelfUpdate: typeof actions.showAvailableSelfUpdate;
  dismissStatus: typeof actions.dismissStatus;
  dismissStatusMessage: typeof actions.dismissStatusMessage;
}

const mapStateToProps = createStructuredSelector({
  selfUpdate: (state: IState) => state.selfUpdate,
  statusMessages: (state: IState) => state.status.messages,
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  showAvailableSelfUpdate: dispatcher(dispatch, actions.showAvailableSelfUpdate),
  applySelfUpdateRequest: dispatcher(dispatch, actions.applySelfUpdateRequest),
  dismissStatus: dispatcher(dispatch, actions.dismissStatus),
  dismissStatusMessage: dispatcher(dispatch, actions.dismissStatusMessage),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(StatusBar);
