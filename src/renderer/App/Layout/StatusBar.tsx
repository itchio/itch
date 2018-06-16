import classNames from "classnames";
import { LocalizedString, IRootState } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";

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
class StatusBar extends React.PureComponent<Props & DerivedProps> {
  constructor(props: Props & DerivedProps, context) {
    super(props, context);
  }

  render() {
    const { statusMessages } = this.props;
    const { dismissStatusMessage } = this.props;

    let children: JSX.Element[] = [];
    let active = true;
    let busy = false;
    let callback = (): any => null;

    if (statusMessages.length > 0) {
      callback = () => dismissStatusMessage({});
      children = [
        <Icon key="icon" icon="heart-filled" />,
        <span key="message">{T(statusMessages[0])}</span>,
        <Icon key="cross" icon="cross" />,
      ];
    } else {
      active = false;
    }

    const classes = classNames({ active, busy });

    const onClick = () => {
      if (callback) {
        callback();
      }
    };

    return (
      <StatusBarDiv className={classes}>
        <div className="filler" />
        <div onClick={onClick}>{children}</div>
        <div className="filler" />
      </StatusBarDiv>
    );
  }
}

interface Props {}

const actionCreators = actionCreatorsList("dismissStatusMessage");

type DerivedProps = Dispatchers<typeof actionCreators> & {
  statusMessages: LocalizedString[];
};

export default connect<Props>(
  StatusBar,
  {
    state: createStructuredSelector({
      statusMessages: (rs: IRootState) => rs.status.messages,
    }),
    actionCreators,
  }
);
