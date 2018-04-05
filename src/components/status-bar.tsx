import React from "react";
import classNames from "classnames";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import Icon from "./basics/icon";
import LoadingCircle from "./basics/loading-circle";

import { IRootState, ISelfUpdateState, ILocalizedString } from "../types";

import format from "./format";

import styled from "./styles";

const StatusBarDiv = styled.div`
  position: fixed;
  transition: all 0.4s;
  bottom: -60px;
  opacity: 0;

  &.active {
    bottom: 15px;
    opacity: 1;
  }

  left: 50%;
  transform: translateX(-50%);

  animation: bottom 0.2s;
  padding: 8px 12px;
  z-index: 200;

  font-size: ${props => props.theme.fontSizes.sidebar};

  border-radius: 4px;
  background: ${props => props.theme.accent};
  border: 1px solid ${props => props.theme.lightAccent};
  box-shadow: 0 0 14px ${props => props.theme.sidebarBackground};

  display: flex;
  flex-direction: row;
  align-items: center;

  &.active {
    .self-update:hover {
      cursor: pointer;
      -webkit-filter: brightness(110%);

      &.busy {
        cursor: default;
      }
    }
  }

  .filler {
    flex-grow: 1;
  }

  .icon {
    margin-right: 8px;
  }

  .icon-cross {
    margin-left: 8px;
    -webkit-filter: brightness(90%);

    &:hover {
      -webkit-filter: none;
    }
  }
`;

/**
 * Displays our current progress when checking for updates, etc.
 */
class StatusBar extends React.PureComponent<IProps & IDerivedProps> {
  constructor(props: IProps & IDerivedProps, context) {
    super(props, context);
  }

  render() {
    const { statusMessages, selfUpdate } = this.props;
    const {
      dismissStatus,
      dismissStatusMessage,
      applySelfUpdateRequest,
      showAvailableSelfUpdate,
    } = this.props;
    let {
      error,
      uptodate,
      available,
      downloading,
      downloaded,
      checking,
    } = selfUpdate;

    let children: JSX.Element[] = [];
    let active = true;
    let busy = false;
    let callback = (): any => null;

    if (statusMessages.length > 0) {
      callback = () => dismissStatusMessage({});
      children = [
        <Icon key="icon" icon="heart-filled" />,
        <span key="message">{format(statusMessages[0])}</span>,
        <Icon key="cross" icon="cross" />,
      ];
    } else if (error) {
      callback = () => dismissStatus({});
      children = [
        <Icon key="icon" icon="heart-broken" />,
        <span key="message">Update error: {error}</span>,
        <Icon key="cross" icon="cross" />,
      ];
    } else if (downloaded) {
      callback = () => applySelfUpdateRequest({});
      children = [
        <Icon key="icon" icon="install" />,
        <span key="message">{format(["status.downloaded"])}</span>,
      ];
    } else if (downloading) {
      busy = true;
      children = [
        <Icon key="icon" icon="download" />,
        <span key="message">{format(["status.downloading"])}</span>,
      ];
    } else if (available) {
      callback = () => showAvailableSelfUpdate({});
      children = [
        <Icon key="icon" icon="earth" />,
        <span key="message">{format(["status.available"])}</span>,
      ];
    } else if (checking) {
      busy = true;
      children = [
        <LoadingCircle key="progress" progress={-1} />,
        <span key="message">{format(["status.checking"])}</span>,
      ];
    } else if (uptodate) {
      children = [
        <Icon key="icon" icon="like" />,
        <span key="message">{format(["status.uptodate"])}</span>,
      ];
    } else {
      active = false;
    }

    const classes = classNames({ active, busy });
    const selfUpdateClasses = classNames("self-update", { busy });

    const onClick = () => {
      if (callback) {
        callback();
      }
    };

    return (
      <StatusBarDiv className={classes}>
        <div className="filler" />
        <div className={selfUpdateClasses} onClick={onClick}>
          {children}
        </div>
        <div className="filler" />
      </StatusBarDiv>
    );
  }
}

interface IProps {}

const actionCreators = actionCreatorsList(
  "applySelfUpdateRequest",
  "showAvailableSelfUpdate",
  "dismissStatus",
  "dismissStatusMessage"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  selfUpdate: ISelfUpdateState;
  statusMessages: ILocalizedString[];
};

export default connect<IProps>(StatusBar, {
  state: createStructuredSelector({
    selfUpdate: (rs: IRootState) => rs.selfUpdate,
    statusMessages: (rs: IRootState) => rs.status.messages,
  }),
  actionCreators,
});
