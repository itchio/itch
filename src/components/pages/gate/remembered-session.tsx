import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "../../connect";

import TimeAgo from "../../basics/time-ago";
import IconButton from "../../basics/icon-button";

import defaultImages from "../../../constants/default-images";

import { actions } from "../../../actions";
import { Session } from "../../../buse/messages";

import styled from "../../styles";

import format from "../../format";

const RememberedSessionDiv = styled.div`
  flex-shrink: 0;
  min-width: 300px;
  border-radius: 2px;
  background: ${props => props.theme.sidebarBackground};
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 4px;

  .avatar {
    filter: grayscale(100%);

    width: 64px;
    height: 64px;
    border-radius: 2px;
    margin-right: 4px;
  }

  &:hover .avatar {
    filter: grayscale(0%);
  }

  p {
    padding: 2px 0;
  }

  .rest {
    padding: 6px 8px;
  }

  .filler {
    flex-grow: 8;
  }

  .username {
    color: ${props => props.theme.baseText};
    font-size: ${props => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 4px 0;
  }

  .last-connected {
    color: ${props => props.theme.secondaryText};
    font-size: 14px;
  }

  box-shadow: 0 0 4px ${props => props.theme.sidebarBackground};

  &:hover {
    box-shadow: 0 0 8px ${props => props.theme.sidebarBackground};
    cursor: pointer;
  }

  &:active {
    -webkit-filter: brightness(70%);
  }
`;

export class RememberedSession extends React.PureComponent<
  IProps & IDerivedProps
> {
  render() {
    const { session, forgetSessionRequest } = this.props;
    const { user } = session;
    const { username, displayName, coverUrl = defaultImages.avatar } = user;

    const onForget = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      forgetSessionRequest({ session });
    };

    return (
      <RememberedSessionDiv
        className="remembered-session"
        onClick={() => {
          this.props.onLogin({ session });
        }}
      >
        <img className="avatar" src={coverUrl} />
        <div className="rest">
          <p className="username">{displayName || username}</p>
          <p className="last-connected">
            {format(["login.remembered_session.last_connected"])}{" "}
            <TimeAgo date={session.lastConnected} />
          </p>
        </div>
        <div className="filler" />
        <span
          data-rh-at="left"
          data-rh={JSON.stringify(["prompt.forget_session.action"])}
        >
          <IconButton
            icon="cross"
            className="forget-session"
            onClick={onForget}
          />
        </span>
      </RememberedSessionDiv>
    );
  }
}

interface IProps {
  session: Session;
  onLogin: (payload: typeof actions.useSavedLogin.payload) => void;
}

const actionCreators = actionCreatorsList("forgetSessionRequest");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(RememberedSession, { actionCreators });
