import * as React from "react";
import { connect, I18nProps } from "../../connect";

import TimeAgo from "../../basics/time-ago";
import IconButton from "../../basics/icon-button";

import defaultImages from "../../../constants/default-images";

import * as actions from "../../../actions";

import { IRememberedSession } from "../../../types";
import { dispatcher } from "../../../constants/action-types";

import styled from "../../styles";

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

  .forget-session {
    visibility: hidden;
  }

  &:hover .forget-session {
    visibility: visible;
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
  IProps & IDerivedProps & I18nProps,
  void
> {
  render() {
    const { t, session, loginWithToken, forgetSessionRequest } = this.props;
    const { me, key } = session;
    const { id, username, displayName, coverUrl = defaultImages.avatar } = me;

    const onForget = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      forgetSessionRequest({ id, username });
    };

    return (
      <RememberedSessionDiv
        className="remembered-session"
        onClick={() => {
          const payload = { username, key, me };
          if (this.props.onLogin) {
            this.props.onLogin(payload);
          }
          loginWithToken(payload);
        }}
      >
        <img className="avatar" src={coverUrl} />
        <div className="rest">
          <p className="username">{displayName || username}</p>
          <p className="last-connected">
            {t("login.remembered_session.last_connected")}{" "}
            <TimeAgo date={new Date(session.lastConnected)} />
          </p>
        </div>
        <div className="filler" />
        <span data-rh-at="left" data-rh="Forget this session">
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
  session: IRememberedSession;
  onLogin?: typeof actions.loginWithToken;
}

interface IDerivedProps {
  loginWithToken: typeof actions.loginWithToken;
  forgetSessionRequest: typeof actions.forgetSessionRequest;
}

export default connect<IProps>(RememberedSession, {
  dispatch: dispatch => ({
    loginWithToken: dispatcher(dispatch, actions.loginWithToken),
    forgetSessionRequest: dispatcher(dispatch, actions.forgetSessionRequest),
  }),
});
