
import * as React from "react";
import * as classNames from "classnames";
import {createStructuredSelector} from "reselect";
import {connect, I18nProps} from "./connect";

import * as actions from "../actions";
import urls from "../constants/urls";

import Icon from "./icon";

import {IAppState, ISelfUpdateState, ILocalizedString} from "../types";
import {dispatcher} from "../constants/action-types";

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends React.Component<IProps & IDerivedProps & I18nProps, void> {
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

interface IProps {}

interface IDerivedProps {
  selfUpdate: ISelfUpdateState;
  statusMessages: ILocalizedString[];

  applySelfUpdateRequest: typeof actions.applySelfUpdateRequest;
  showAvailableSelfUpdate: typeof actions.showAvailableSelfUpdate;
  dismissStatus: typeof actions.dismissStatus;
  dismissStatusMessage: typeof actions.dismissStatusMessage;
}

export default connect<IProps>(StatusBar, {
  state: createStructuredSelector({
    selfUpdate: (state: IAppState) => state.selfUpdate,
    statusMessages: (state: IAppState) => state.status.messages,
  }),
  dispatch: (dispatch) => ({
    showAvailableSelfUpdate: dispatcher(dispatch, actions.showAvailableSelfUpdate),
    applySelfUpdateRequest: dispatcher(dispatch, actions.applySelfUpdateRequest),
    dismissStatus: dispatcher(dispatch, actions.dismissStatus),
    dismissStatusMessage: dispatcher(dispatch, actions.dismissStatusMessage),
  }),
});
